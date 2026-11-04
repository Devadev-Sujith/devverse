import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const vert = /* glsl */ `
attribute float size; attribute float phase; attribute vec3 color;
uniform float uTime; varying vec3 vColor; varying float vTw;
void main(){
  vColor=color; vTw=0.65+0.35*sin(uTime*1.5+phase);
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  gl_PointSize=size*(320.0/-mv.z);
  gl_Position=projectionMatrix*mv;
}`
const frag = /* glsl */ `
varying vec3 vColor; varying float vTw;
void main(){
  float d=length(gl_PointCoord-0.5);
  float a=smoothstep(0.5,0.0,d); a=pow(a,2.2);
  gl_FragColor=vec4(vColor*vTw*1.4,a);
}`

export function Starfield({ count = 7000 }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const palette = ['#ffffff', '#cfe3ff', '#ffe9c4', '#a8c8ff', '#ffd1e8'].map((c) => new THREE.Color(c))
    for (let i = 0; i < count; i++) {
      const r = 400 + Math.random() * 600
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3)
      const c = palette[Math.floor(Math.random() * palette.length)]
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = Math.random() < 0.02 ? 9 + Math.random() * 6 : 2 + Math.random() * 4
      phase[i] = Math.random() * 100
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setAttribute('size', new THREE.BufferAttribute(size, 1))
    g.setAttribute('phase', new THREE.BufferAttribute(phase, 1))
    return g
  }, [count])

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** A distant spiral galaxy hanging in the sky. */
export function DistantGalaxy() {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const n = 18000
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const inner = new THREE.Color('#ffcf8a')
    const outer = new THREE.Color('#6d5cff')
    const arms = 4
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 1.6) * 140
      const arm = ((i % arms) / arms) * Math.PI * 2
      const spin = r * 0.045
      const spread = (1 - r / 160) * 0.2 + 0.08
      const rx = (Math.random() - 0.5) * r * spread * 2
      const ry = (Math.random() - 0.5) * (12 - r * 0.06)
      const rz = (Math.random() - 0.5) * r * spread * 2
      pos.set([Math.cos(arm + spin) * r + rx, ry, Math.sin(arm + spin) * r + rz], i * 3)
      const c = inner.clone().lerp(outer, r / 140)
      col.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [])
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01
  })
  return (
    <group position={[620, 210, -320]} rotation={[0.9, -0.6, 0.4]}>
      <points ref={ref} geometry={geo}>
        <pointsMaterial
          size={1.6}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
