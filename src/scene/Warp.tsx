import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../lib/store'

const N = 1600
const DEPTH = 500

/** Hyperspace streaks rendered in camera space. */
export function Warp() {
  const phase = useStore((s) => s.phase)
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.LineBasicMaterial>(null)
  const state = useRef({ elapsed: 0, opacity: 0 })
  const { geo, base } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(N * 6)
    const col = new Float32Array(N * 6)
    const base = new Float32Array(N * 3)
    const palette = ['#9fd8ff', '#ffffff', '#c6a8ff', '#7cf7c9'].map((c) => new THREE.Color(c))
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 3 + Math.pow(Math.random(), 0.7) * 60
      base.set([Math.cos(a) * r, Math.sin(a) * r, -Math.random() * DEPTH], i * 3)
      const c = palette[i % palette.length]
      col.set([c.r, c.g, c.b, c.r * 0.1, c.g * 0.1, c.b * 0.1], i * 6)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return { geo: g, base }
  }, [])

  useFrame((_, dt) => {
    const s = state.current
    const active = phase === 'warp'
    if (active) s.elapsed += dt
    s.opacity = THREE.MathUtils.lerp(s.opacity, active ? 1 : 0, Math.min(1, dt * (active ? 5 : 2.5)))
    if (!active && s.opacity < 0.01) s.opacity = 0
    if (!group.current || !mat.current) return
    group.current.visible = s.opacity > 0.01
    if (!group.current.visible) return
    group.current.position.copy(camera.position)
    group.current.quaternion.copy(camera.quaternion)
    mat.current.opacity = s.opacity
    const speed = active ? 120 + Math.sin(Math.min(1, s.elapsed / 2.6) * Math.PI) * 900 : 200
    const len = speed * 0.06
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < N; i++) {
      let z = base[i * 3 + 2] + speed * dt
      if (z > 5) z -= DEPTH
      base[i * 3 + 2] = z
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      pos[i * 6] = x
      pos[i * 6 + 1] = y
      pos[i * 6 + 2] = z
      pos[i * 6 + 3] = x
      pos[i * 6 + 4] = y
      pos[i * 6 + 5] = z - len
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={geo} frustumCulled={false}>
        <lineBasicMaterial ref={mat} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
    </group>
  )
}
