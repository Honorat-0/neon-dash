import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PARTICLE_COUNT, particles } from '../game/particles'
import { runtime } from '../game/runtime'
import { useGameStore } from '../game/store'

const dummy = new THREE.Object3D()
const color = new THREE.Color()

export function Particles() {
  const mesh = useRef<THREE.InstancedMesh>(null!)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const paused = useGameStore.getState().phase === 'paused'
    const m = mesh.current
    const dz = runtime.frameDz

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      if (!p.active) {
        dummy.position.set(0, -50, 0)
        dummy.scale.setScalar(0.0001)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
        continue
      }

      if (!paused) {
        p.life -= dt
        if (p.life <= 0) {
          p.active = false
          continue
        }
        p.vy -= 14 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.z += p.vz * dt + dz
        if (p.y < 0.05) {
          p.y = 0.05
          p.vy *= -0.4
          p.vx *= 0.8
          p.vz *= 0.8
        }
      }

      const k = p.life / p.maxLife
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(p.size * (0.3 + k))
      dummy.rotation.set(p.spin * p.life, p.spin * 0.7 * p.life, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      color.setRGB(p.r, p.g, p.b)
      m.setColorAt(i, color)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  )
}
