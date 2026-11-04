import { Billboard, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { profile } from '../config/profile'
import { blip } from '../lib/audio'
import { useStore } from '../lib/store'
import { noiseGLSL } from './noise'

const vert = /* glsl */ `
varying vec3 vPos; varying vec3 vNormal; varying vec3 vView;
void main(){
  vPos=position; vNormal=normalize(normalMatrix*normal);
  vec4 mv=modelViewMatrix*vec4(position,1.0); vView=normalize(-mv.xyz);
  gl_Position=projectionMatrix*mv;
}`
const frag = /* glsl */ `
uniform float uTime; varying vec3 vPos; varying vec3 vNormal; varying vec3 vView;
${noiseGLSL}
void main(){
  vec3 p=normalize(vPos)*2.2;
  float n=fbm(p+vec3(uTime*0.05,uTime*0.03,-uTime*0.04));
  float n2=fbm(p*3.0-vec3(0.0,uTime*0.08,0.0));
  float heat=0.55+0.45*n+0.25*n2;
  vec3 c1=vec3(1.0,0.35,0.08); vec3 c2=vec3(1.0,0.78,0.35); vec3 c3=vec3(1.0,0.97,0.85);
  vec3 col=mix(c1,c2,smoothstep(0.2,0.7,heat)); col=mix(col,c3,smoothstep(0.75,1.1,heat));
  float rim=pow(1.0-max(dot(vNormal,vView),0.0),2.0);
  col+=vec3(1.0,0.5,0.2)*rim*1.5;
  gl_FragColor=vec4(col*1.5,1.0);
}`

const glowFrag = /* glsl */ `
uniform float uTime; uniform vec3 uColor; uniform float uPower; varying vec2 vUv;
void main(){
  vec2 p=vUv-0.5; float d=length(p)*2.0;
  float a=atan(p.y,p.x);
  float rays=0.85+0.15*sin(a*12.0+uTime*0.6)*sin(a*7.0-uTime*0.4);
  float g=pow(max(1.0-d,0.0),uPower)*rays;
  gl_FragColor=vec4(uColor*g,g);
}`
const glowVert = /* glsl */ `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`

export function CoreStar() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const glow = useRef<THREE.ShaderMaterial>(null)
  const glow2 = useRef<THREE.ShaderMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  const setView = useStore((s) => s.setView)
  const view = useStore((s) => s.view)
  const phase = useStore((s) => s.phase)

  useFrame((_, dt) => {
    for (const m of [mat.current, glow.current, glow2.current]) if (m) m.uniforms.uTime.value += dt
    if (mesh.current) mesh.current.rotation.y += dt * 0.03
  })

  return (
    <group>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation()
          blip(520, 0.15)
          setView('core')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.classList.add('pointer')
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.classList.remove('pointer')
        }}
      >
        <sphereGeometry args={[5, 96, 96]} />
        <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={{ uTime: { value: 0 } }} toneMapped={false} />
      </mesh>
      <Billboard>
        <mesh>
          <planeGeometry args={[34, 34]} />
          <shaderMaterial
            ref={glow}
            vertexShader={glowVert}
            fragmentShader={glowFrag}
            uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.55, 0.2) }, uPower: { value: 3.2 } }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <planeGeometry args={[90, 90]} />
          <shaderMaterial
            ref={glow2}
            vertexShader={glowVert}
            fragmentShader={glowFrag}
            uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color(0.6, 0.3, 0.9) }, uPower: { value: 5.0 } }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      <Html position={[0, -7.5, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`world-label core ${hover ? 'hot' : ''} ${view !== 'core' && phase === 'explore' ? '' : 'off'}`}>
            <span className="dot" />
            {profile.callsign} · CORE
          </div>
        </Html>
    </group>
  )
}
