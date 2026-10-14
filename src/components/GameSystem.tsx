import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { CONFIG } from '../game/config'
import { runtime } from '../game/runtime'
import { useGameStore } from '../game/store'

export const computeScore = () => Math.floor(runtime.distance) + runtime.coinsThisRun * CONFIG.COIN_VALUE

/**
 * Master game loop: advances speed/distance and publishes throttled HUD stats.
 * Must be mounted first in the scene so its useFrame runs before other systems.
 */
export function GameSystem() {
  const hudTimer = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const phase = useGameStore.getState().phase

    if (phase === 'paused') {
      runtime.frameDz = 0
      return
    }

    runtime.elapsed += dt

    switch (phase) {
      case 'playing':
        runtime.speed = Math.min(CONFIG.MAX_SPEED, runtime.speed + CONFIG.ACCEL * dt)
        break
      case 'menu':
        runtime.speed = MathUtils.damp(runtime.speed, CONFIG.MENU_SPEED, 2, dt)
        break
      case 'gameover':
        runtime.speed = MathUtils.damp(runtime.speed, 0, 5, dt)
        break
    }

    runtime.frameDz = runtime.speed * dt

    if (phase === 'playing') {
      runtime.distance += runtime.frameDz
      hudTimer.current += dt
      if (hudTimer.current >= 0.06) {
        hudTimer.current = 0
        useGameStore.getState().setHudStats(computeScore(), Math.round(runtime.speed * 5))
      }
    }
  })

  return null
}
