import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { CONFIG } from '../game/config'
import { GameSystem } from './GameSystem'
import { CameraRig } from './CameraRig'
import { Player } from './Player'
import { Entities } from './Entities'
import { Floor } from './Floor'
import { Pillars } from './Pillars'
import { Particles } from './Particles'
import { Sun } from './Sun'

export function Scene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 58, near: 0.1, far: 600, position: [0, 4.2, 8.5] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[CONFIG.BG_COLOR]} />
      <fog attach="fog" args={[CONFIG.FOG_COLOR, CONFIG.FOG_NEAR, CONFIG.FOG_FAR]} />

      {/* Systems (GameSystem first so its frame loop runs before the others) */}
      <GameSystem />
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#8a7cff" />
      <hemisphereLight args={['#5b4dff', '#ff2d95', 0.45]} />
      <directionalLight position={[6, 12, 4]} intensity={1.4} color="#dfe6ff" />
      <directionalLight position={[-8, 6, -10]} intensity={0.6} color="#ff5fb0" />

      {/* World */}
      <Suspense fallback={null}>
        <Stars radius={260} depth={60} count={2500} factor={5} saturation={0.6} fade speed={0.6} />
        <Sun />
        <Floor />
        <Pillars />
        <Player />
        <Entities />
        <Particles />
      </Suspense>

      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.3} intensity={1.15} mipmapBlur radius={0.65} />
        <Vignette eskil={false} offset={0.18} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
