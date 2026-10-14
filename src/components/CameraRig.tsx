import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime, difficulty } from '../game/runtime'
import { useGameStore } from '../game/store'

const BASE_FOV = 58

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const target = useRef(new THREE.Vector3(0, 4.2, 8.5))
  const look = useRef(new THREE.Vector3(0, 1.2, -10))
  const smoothLook = useRef(new THREE.Vector3(0, 1.2, -10))

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const phase = useGameStore.getState().phase
    const px = runtime.playerX
    const py = runtime.playerY
    const d = difficulty()

    const menu = phase === 'menu'
    target.current.set(menu ? Math.sin(runtime.elapsed * 0.3) * 1.5 : px * 0.42, menu ? 3.4 : 4.1 + py * 0.25, menu ? 7.5 : 8.6)
    look.current.set(px * 0.25, menu ? 1.5 : 1.1, -10)

    // crash shake
    if (runtime.crashAt >= 0) {
      const since = runtime.elapsed - runtime.crashAt
      if (since < 0.7) {
        const k = (1 - since / 0.7) * 0.5
        target.current.x += (Math.random() - 0.5) * k
        target.current.y += (Math.random() - 0.5) * k
        look.current.x += (Math.random() - 0.5) * k
      }
    }

    const lambda = 1 - Math.exp(-7 * dt)
    camera.position.lerp(target.current, lambda)
    smoothLook.current.lerp(look.current, lambda)
    camera.lookAt(smoothLook.current)

    const fov = BASE_FOV + d * 16
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 2.5, dt)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
