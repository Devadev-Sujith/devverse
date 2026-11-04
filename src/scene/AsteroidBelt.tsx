import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../lib/store'

/** The frontier: raw material for worlds not yet built. */
export function AsteroidBelt({ radius }: { radius: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const count = 1400
  const view = useStore((s) => s.view)
  const phase = useStore((s) => s.phase)
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.35, 0), [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3()
    const p = new THREE.Vector3()
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = radius + (Math.random() - 0.5) * 9 + Math.sin(a * 6) * 1.5
      p.set(Math.cos(a) * r, (Math.random() - 0.5) * 2.2, Math.sin(a) * r)
      e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      q.setFromEuler(e)
      const k = 0.3 + Math.pow(Math.random(), 3) * 2.2
      s.set(k, k * (0.6 + Math.random() * 0.6), k)
      m.compose(p, q, s)
      ref.current!.setMatrixAt(i, m)
      ref.current!.setColorAt(i, c.setHSL(0.6 + Math.random() * 0.15, 0.15, 0.35 + Math.random() * 0.3))
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [radius])
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004
  })
  return (
    <group ref={group}>
      <instancedMesh ref={ref} args={[geo, undefined, count]}>
        <meshStandardMaterial roughness={0.9} metalness={0.1} flatShading />
      </instancedMesh>
      <Html position={[radius * 0.7, 3, radius * 0.7]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`world-label frontier ${phase === 'explore' && (view === 'home' || view === 'worlds') ? '' : 'off'}`}>
            <span className="dot" />
            THE FRONTIER · next world forming…
          </div>
        </Html>
    </group>
  )
}
