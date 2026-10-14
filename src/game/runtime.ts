import { CONFIG } from './config'

/**
 * Mutable, non-reactive per-frame game state.
 * Systems read/write this inside useFrame without triggering React renders.
 */
export interface Runtime {
  generation: number
  speed: number
  frameDz: number
  distance: number
  elapsed: number
  lane: number
  playerX: number
  playerY: number
  grounded: boolean
  jumpQueuedAt: number
  crashAt: number
  coinsThisRun: number
}

export const runtime: Runtime = {
  generation: 0, // incremented on every new run so systems can reset their pools
  speed: CONFIG.MENU_SPEED,
  frameDz: 0, // world displacement for the current frame (speed * dt)
  distance: 0,
  elapsed: 0,
  lane: 0, // -1 | 0 | 1
  playerX: 0,
  playerY: 0,
  grounded: true,
  jumpQueuedAt: -1, // runtime.elapsed when a jump was requested (input buffering)
  crashAt: -1, // runtime.elapsed when the player crashed
  coinsThisRun: 0,
}

export function resetRuntime() {
  runtime.generation++
  runtime.speed = CONFIG.START_SPEED
  runtime.frameDz = 0
  runtime.distance = 0
  runtime.elapsed = 0
  runtime.lane = 0
  runtime.playerX = 0
  runtime.playerY = 0
  runtime.grounded = true
  runtime.jumpQueuedAt = -1
  runtime.crashAt = -1
  runtime.coinsThisRun = 0
}

export const laneX = (lane: number) => lane * CONFIG.LANE_WIDTH

export const difficulty = () =>
  Math.min(1, Math.max(0, (runtime.speed - CONFIG.START_SPEED) / (CONFIG.MAX_SPEED - CONFIG.START_SPEED)))
