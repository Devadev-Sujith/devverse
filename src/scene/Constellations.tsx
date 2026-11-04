import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { profile } from '../config/profile'
import { useStore } from '../lib/store'
import { hash } from '../lib/worlds'

export const SKY_CENTER = new THREE.Vector3(0, 55, -190)

type Star = { name: string; level: number; pos: THREE.Vector3 }

export function useConstellations() {
  return useMemo(() => {
    const groups = profile.skills
    return groups.map((g, gi) => {
      const spread = 46
      const cx = (gi - (groups.length - 1) / 2) * spread
      const cy = SKY_CENTER.y + (gi % 2 === 0 ? 10 : -12)
      const center = new THREE.Vector3(cx, cy, SKY_CENTER.z + Math.abs(gi - (groups.length - 1) / 2) * 20)
      const stars: Star[] = g.skills.map((s, i) => {
        const h = hash(s.name + g.constellation)
        const a = (i / g.skills.length) * Math.PI * 2 + h * 1.4
        const r = 9 + h * 12
        return { name: s.name, level: s.level, pos: center.clone().add(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.85, (h - 0.5) * 8)) }
      })
      const lines: [THREE.Vector3, THREE.Vector3][] = []
      const order = [...stars].sort((a, b) => Math.atan2(a.pos.y - cy, a.pos.x - cx) - Math.atan2(b.pos.y - cy, b.pos.x - cx))
      for (let i = 0; i < order.length - 1; i++) lines.push([order[i].pos, order[i + 1].pos])
      if (order.length > 3) lines.push([order[0].pos, order[Math.floor(order.length / 2)].pos])
      return { ...g, center, stars, lines }
    })
  }, [])
}

function SkillStar({ star, color, show }: { star: Star; color: string; show: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const offset = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + offset) * 0.15)
  })
  const size = 0.5 + star.level * 0.28
  return (
    <group position={star.pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2.5)} toneMapped={false} />
      </mesh>
      <Html center position={[0, -size - 1.8, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`skill-label ${show ? '' : 'off'}`} style={{ ['--c' as string]: color }}>
            {star.name}
            <span className="pips">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < star.level ? 'on' : ''} />
              ))}
            </span>
          </div>
        </Html>
    </group>
  )
}

export function Constellations() {
  const data = useConstellations()
  const view = useStore((s) => s.view)
  const show = view === 'skills'
  return (
    <group>
      {data.map((g) => (
        <group key={g.constellation}>
          {g.lines.map(([a, b], i) => (
            <Line
              key={i}
              points={[a, b]}
              color={g.color}
              lineWidth={show ? 1.6 : 0.8}
              transparent
              opacity={show ? 0.8 : 0.25}
              dashed={!show}
              dashSize={1}
              gapSize={1}
            />
          ))}
          {g.stars.map((s) => (
            <SkillStar key={s.name} star={s} color={g.color} show={show} />
          ))}
          <Html center position={[g.center.x, g.center.y + 26, g.center.z]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div className={`constellation-label ${show ? '' : 'off'}`} style={{ ['--c' as string]: g.color }}>
                <small>{g.domain}</small>
                {g.constellation}
              </div>
            </Html>
        </group>
      ))}
    </group>
  )
}
