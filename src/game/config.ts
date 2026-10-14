export const CONFIG = {
  LANE_WIDTH: 2,
  START_SPEED: 14,
  MAX_SPEED: 40,
  ACCEL: 0.32, // units/sec^2
  MENU_SPEED: 7,
  SPAWN_Z: -92,
  DESPAWN_Z: 14,
  GRAVITY: -32,
  JUMP_VELOCITY: 11,
  FOG_NEAR: 35,
  FOG_FAR: 150,
  FOG_COLOR: '#0b0520',
  BG_COLOR: '#0b0520',
  COIN_VALUE: 25,
  JUMP_BUFFER: 0.15, // seconds a jump press is remembered
  RESTART_LOCKOUT: 700, // ms after crash before restart allowed
} as const

export const COLORS = {
  player: '#7df9ff',
  playerEmissive: '#00d8ff',
  block: '#ff2d95',
  bar: '#ffb020',
  wall: '#9b5cff',
  coin: '#ffd84a',
  cyan: '#00e5ff',
  magenta: '#ff2d95',
  purple: '#a855f7',
} as const

export const AIR_TIME = (2 * CONFIG.JUMP_VELOCITY) / -CONFIG.GRAVITY
