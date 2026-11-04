import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Suspense, useState } from 'react'
import { useStore } from '../lib/store'
import { AsteroidBelt } from './AsteroidBelt'
import { CameraRig } from './CameraRig'
import { Constellations } from './Constellations'
import { CoreStar } from './CoreStar'
import { Planet } from './Planet'
import { DistantGalaxy, Starfield } from './Starfield'
import { Warp } from './Warp'

export function Universe() {
  const worlds = useStore((s) => s.worlds)
  const select = useStore((s) => s.select)
  const [dpr, setDpr] = useState(1.75)
  const maxOrbit = worlds.length ? worlds[worlds.length - 1].orbit : 40
  return (
    <Canvas
      className="universe"
      dpr={dpr}
      camera={{ fov: 55, near: 0.1, far: 4000, position: [60, 90, 900] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => select(null)}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <color attach="background" args={['#02030a']} />
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={4} decay={0} color="#ffd9b0" />
      <Suspense fallback={null}>
        <Starfield />
        <DistantGalaxy />
        <CoreStar />
        {worlds.map((w) => (
          <Planet key={w.id} world={w} />
        ))}
        <AsteroidBelt radius={maxOrbit + 14} />
        <Constellations />
        <Warp />
      </Suspense>
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.6} luminanceSmoothing={0.3} radius={0.75} />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}
