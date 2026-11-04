import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { sim } from '../lib/sim'
import { useStore } from '../lib/store'
import { worldPosition } from '../lib/worlds'
import { SKY_CENTER } from './Constellations'

const isMobile = () => window.innerWidth < 760

export function homeDistance(maxOrbit: number) {
  return (maxOrbit + 14) * (isMobile() ? 2.9 : 1.85)
}

export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const phase = useStore((s) => s.phase)
  const view = useStore((s) => s.view)
  const selected = useStore((s) => s.selected)
  const worlds = useStore((s) => s.worlds)
  const track = useRef(0)
  const maxOrbit = worlds.length ? worlds[worlds.length - 1].orbit : 40

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (phase === 'boot') {
      c.smoothTime = 0.5
      void c.setLookAt(60, 90, 900, 0, 0, 0, false)
      return
    }
    sim.targetSpeed = selected ? 0 : 1
    c.smoothTime = phase === 'warp' ? 1.1 : 0.7
    const d = homeDistance(maxOrbit)
    if (selected) {
      track.current = 2.5
      return
    }
    switch (view) {
      case 'skills':
        {
        const pan = isMobile() ? 0 : -38
        void c.setLookAt(pan, 34, isMobile() ? 40 : -6, SKY_CENTER.x + pan, SKY_CENTER.y, SKY_CENTER.z, true)
        break
      }
      case 'core':
        void c.setLookAt(isMobile() ? 0 : 20, 7, isMobile() ? 40 : 28, isMobile() ? 0 : 9, isMobile() ? -6 : 0, 0, true)
        break
      case 'worlds':
        void c.setLookAt(0, d * 0.95, d * 0.45, 0, 0, 0, true)
        break
      case 'comms':
        void c.setLookAt(-d * 0.9, d * 0.25, d * 0.7, isMobile() ? 0 : -d * 0.18, 0, 0, true)
        break
      default:
        void c.setLookAt(0, d * 0.36, d, 0, 0, 0, true)
    }
  }, [phase, view, selected, maxOrbit])

  const p: [number, number, number] = [0, 0, 0]
  const v = new THREE.Vector3()
  useFrame((_, dt) => {
    sim.speed = THREE.MathUtils.lerp(sim.speed, sim.targetSpeed, Math.min(1, dt * 2.5))
    sim.t += dt * sim.speed
    const c = ref.current
    if (!c || !selected || track.current <= 0) return
    track.current -= dt
    const w = worlds.find((x) => x.id === selected)
    if (!w) return
    worldPosition(w, sim.t, p)
    const dist = w.radius * (isMobile() ? 9 : 6.5)
    v.set(p[0], 0, p[2]).normalize()
    const side = new THREE.Vector3(-v.z, 0, v.x)
    const cam = new THREE.Vector3(p[0], p[1], p[2]).addScaledVector(v, dist * 0.55).addScaledVector(side, dist * 0.85)
    cam.y += w.radius * 1.6
    const target = new THREE.Vector3(p[0], p[1], p[2])
    if (isMobile()) target.y -= w.radius * 1.4
    else target.addScaledVector(side, -w.radius * 1.6)
    void c.setLookAt(cam.x, cam.y, cam.z, target.x, target.y, target.z, true)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={phase === 'explore'}
      minDistance={4}
      maxDistance={900}
      dollySpeed={0.6}
      truckSpeed={1}
    />
  )
}
