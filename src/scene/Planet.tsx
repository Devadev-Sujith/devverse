import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { blip } from '../lib/audio'
import { sim } from '../lib/sim'
import { useStore } from '../lib/store'
import type { World } from '../lib/types'
import { worldPosition } from '../lib/worlds'
import { noiseGLSL } from './noise'

const kindIndex = { rocky: 0, gas: 1, ice: 2, lava: 3, ocean: 4 } as const

const vert = /* glsl */ `
varying vec3 vObj; varying vec3 vWorldN; varying vec3 vWorldPos;
void main(){
  vObj=position; vWorldN=normalize(mat3(modelMatrix)*normal);
  vec4 wp=modelMatrix*vec4(position,1.0); vWorldPos=wp.xyz;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`

const frag = /* glsl */ `
uniform vec3 uC1; uniform vec3 uC2; uniform float uKind; uniform float uSeed; uniform float uTime; uniform float uGlow;
varying vec3 vObj; varying vec3 vWorldN; varying vec3 vWorldPos;
${noiseGLSL}
void main(){
  vec3 p=normalize(vObj); vec3 sp=p*2.0+uSeed*20.0;
  vec3 col; float emissive=0.0;
  if(uKind<0.5){ // rocky
    float n=fbm(sp*1.4); float c=fbm(sp*5.0);
    col=mix(uC1*0.55,uC2,smoothstep(-0.3,0.5,n)); col*=0.75+0.35*c;
    col=mix(col,vec3(0.08),smoothstep(0.55,0.75,abs(snoise(sp*3.0))));
  } else if(uKind<1.5){ // gas giant
    float t=fbm(sp*vec3(0.6,3.0,0.6)+vec3(uTime*0.03,0.0,0.0));
    float bands=sin(p.y*14.0+t*4.0+uSeed*10.0);
    col=mix(uC1,uC2,0.5+0.5*bands); col=mix(col,vec3(1.0),0.15*smoothstep(0.6,1.0,bands));
    float storm=smoothstep(0.18,0.0,length(p-normalize(vec3(0.6,-0.25,0.75))));
    col=mix(col,uC2*1.4,storm*0.8);
  } else if(uKind<2.5){ // ice
    float n=fbm(sp*2.0); float cr=1.0-abs(snoise(sp*6.0));
    col=mix(vec3(0.78,0.88,1.0),uC1,0.35+0.25*n); col+=vec3(0.6,0.85,1.0)*pow(cr,12.0)*0.6;
  } else if(uKind<3.5){ // lava
    float n=fbm(sp*1.8); float cr=1.0-abs(snoise(sp*4.0+uTime*0.05));
    col=mix(vec3(0.06,0.04,0.05),uC1*0.25,smoothstep(-0.4,0.6,n));
    float lava=pow(cr,8.0); col+=mix(uC1,vec3(1.0,0.7,0.2),0.5)*lava*2.5; emissive=lava;
  } else { // ocean world
    float n=fbm(sp*1.2);
    vec3 ocean=mix(vec3(0.02,0.08,0.25),vec3(0.05,0.3,0.55),0.5+0.5*snoise(sp*3.0));
    vec3 land=mix(uC1,uC2,fbm(sp*4.0)*0.5+0.5);
    col=mix(ocean,land,smoothstep(0.05,0.12,n));
    float clouds=smoothstep(0.1,0.6,fbm(sp*2.5+vec3(uTime*0.02)));
    col=mix(col,vec3(1.0),clouds*0.55);
  }
  vec3 L=normalize(-vWorldPos); vec3 N=normalize(vWorldN);
  float diff=max(dot(N,L),0.0);
  float wrap=smoothstep(-0.25,0.6,dot(N,L));
  vec3 V=normalize(cameraPosition-vWorldPos);
  float rim=pow(1.0-max(dot(N,V),0.0),3.0);
  vec3 lit=col*(0.06+1.25*diff*wrap) + col*emissive*0.8 + uC1*rim*(0.35+uGlow);
  gl_FragColor=vec4(lit,1.0);
}`

const atmoVert = /* glsl */ `
varying vec3 vN; varying vec3 vWorldPos;
void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.0); vWorldPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`
const atmoFrag = /* glsl */ `
uniform vec3 uColor; uniform float uGlow; varying vec3 vN; varying vec3 vWorldPos;
void main(){
  vec3 V=normalize(cameraPosition-vWorldPos);
  float f=pow(1.0-abs(dot(normalize(vN),V)),3.5);
  float sun=0.35+0.65*max(dot(normalize(vN),normalize(-vWorldPos)),0.0);
  gl_FragColor=vec4(uColor*f*(sun+uGlow)*1.6,f);
}`

const ringVert = /* glsl */ `varying vec2 vUv; varying vec3 vPos; void main(){vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const ringFrag = /* glsl */ `
uniform vec3 uColor; uniform float uInner; uniform float uOuter; uniform float uSeed; varying vec3 vPos;
void main(){
  float r=(length(vPos.xy)-uInner)/(uOuter-uInner);
  float bands=0.5+0.5*sin(r*60.0+uSeed*30.0)*sin(r*23.0);
  float a=smoothstep(0.0,0.08,r)*smoothstep(1.0,0.85,r)*(0.25+0.6*bands);
  gl_FragColor=vec4(uColor*(0.6+bands*0.8),a*0.7);
}`

export function OrbitPath({ world, active }: { world: World; active: boolean }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * world.orbit, Math.sin(a) * world.orbit * world.incline, Math.sin(a) * world.orbit))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [world])
  return (
    <lineLoop geometry={geo}>
      <lineBasicMaterial
        color={active ? world.color : '#7fa8ff'}
        transparent
        opacity={active ? 0.75 : 0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineLoop>
  )
}

const tmp: [number, number, number] = [0, 0, 0]

export function Planet({ world }: { world: World }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const moons = useRef<THREE.Group>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const atmo = useRef<THREE.ShaderMaterial>(null)
  const selected = useStore((s) => s.selected === world.id)
  const hovered = useStore((s) => s.hovered === world.id)
  const view = useStore((s) => s.view)
  const select = useStore((s) => s.select)
  const hover = useStore((s) => s.hover)

  const uniforms = useMemo(
    () => ({
      uC1: { value: new THREE.Color(world.color) },
      uC2: { value: new THREE.Color(world.color2) },
      uKind: { value: kindIndex[world.kind] },
      uSeed: { value: world.seed },
      uTime: { value: 0 },
      uGlow: { value: 0 },
    }),
    [world],
  )
  const atmoUniforms = useMemo(() => ({ uColor: { value: new THREE.Color(world.color) }, uGlow: { value: 0 } }), [world])
  const ringUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(world.color2) },
      uInner: { value: world.radius * 1.4 },
      uOuter: { value: world.radius * 2.3 },
      uSeed: { value: world.seed },
    }),
    [world],
  )

  useFrame((_, dt) => {
    worldPosition(world, sim.t, tmp)
    group.current?.position.set(tmp[0], tmp[1], tmp[2])
    if (body.current) body.current.rotation.y += dt * 0.15
    if (moons.current) moons.current.rotation.y += dt * 0.5
    const target = selected || hovered ? 1 : 0
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt
      mat.current.uniforms.uGlow.value = THREE.MathUtils.lerp(mat.current.uniforms.uGlow.value, target, 0.1)
    }
    if (atmo.current) atmo.current.uniforms.uGlow.value = THREE.MathUtils.lerp(atmo.current.uniforms.uGlow.value, target, 0.1)
  })

  const phase = useStore((s) => s.phase)
  const showLabel = phase === 'explore' && view !== 'skills' && view !== 'core'

  return (
    <>
      <OrbitPath world={world} active={selected || hovered} />
      <group ref={group}>
        <mesh
          visible={false}
          onClick={(e) => {
            e.stopPropagation()
            blip(660, 0.12)
            select(world.id)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            if (!hovered) blip(1200, 0.04, 0.02)
            hover(world.id)
            document.body.classList.add('pointer')
          }}
          onPointerOut={() => {
            hover(null)
            document.body.classList.remove('pointer')
          }}
        >
          <sphereGeometry args={[world.radius * 2, 16, 16]} />
        </mesh>
        <mesh ref={body} rotation={[0.2, 0, world.incline * 2]}>
          <sphereGeometry args={[world.radius, 64, 64]} />
          <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
        </mesh>
        <mesh scale={1.07}>
          <sphereGeometry args={[world.radius, 48, 48]} />
          <shaderMaterial
            ref={atmo}
            vertexShader={atmoVert}
            fragmentShader={atmoFrag}
            uniforms={atmoUniforms}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {world.rings && (
          <mesh rotation={[Math.PI / 2 - 0.35 + world.seed * 0.5, world.seed, 0]}>
            <ringGeometry args={[world.radius * 1.4, world.radius * 2.3, 128]} />
            <shaderMaterial
              vertexShader={ringVert}
              fragmentShader={ringFrag}
              uniforms={ringUniforms}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
        <group ref={moons}>
          {Array.from({ length: world.moons }, (_, i) => {
            const d = world.radius * (2.6 + i * 0.9)
            const a = (i / Math.max(1, world.moons)) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * d, (i - 1) * 0.3, Math.sin(a) * d]}>
                <sphereGeometry args={[world.radius * 0.18, 16, 16]} />
                <meshStandardMaterial color="#bfc6d4" roughness={1} />
              </mesh>
            )
          })}
        </group>
        <Html position={[0, -world.radius - 1.6, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div className={`world-label ${hovered || selected ? 'hot' : ''} ${showLabel ? '' : 'off'}`} style={{ ['--c' as string]: world.color }}>
              <span className="dot" />
              {world.name}
              {(hovered || selected) && (
                <small>
                  {world.language ?? 'Unknown'} · {world.fork ? 'Contribution' : `World #${world.index + 1}`}
                </small>
              )}
            </div>
          </Html>
      </group>
    </>
  )
}
