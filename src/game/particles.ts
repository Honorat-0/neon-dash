export interface Particle {
  active: boolean
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  size: number
  r: number
  g: number
  b: number
  spin: number
}

export const PARTICLE_COUNT = 160

export const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
  active: false,
  x: 0,
  y: 0,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  life: 0,
  maxLife: 1,
  size: 0.1,
  r: 1,
  g: 1,
  b: 1,
  spin: 0,
}))

let cursor = 0

interface BurstOptions {
  count: number
  power: number
  life?: number
  size?: number
  color: [number, number, number]
  upward?: number
}

/** Spawn a burst of particles at a world position. Safe to call from any system. */
export function emitBurst(x: number, y: number, z: number, opts: BurstOptions) {
  const { count, power, color, life = 0.8, size = 0.12, upward = 0 } = opts
  for (let i = 0; i < count; i++) {
    const p = particles[cursor]
    cursor = (cursor + 1) % PARTICLE_COUNT
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const speed = power * (0.35 + Math.random() * 0.65)
    p.active = true
    p.x = x
    p.y = y
    p.z = z
    p.vx = Math.sin(phi) * Math.cos(theta) * speed
    p.vy = Math.abs(Math.cos(phi)) * speed + upward
    p.vz = Math.sin(phi) * Math.sin(theta) * speed
    p.maxLife = life * (0.6 + Math.random() * 0.6)
    p.life = p.maxLife
    p.size = size * (0.6 + Math.random() * 0.8)
    p.r = color[0]
    p.g = color[1]
    p.b = color[2]
    p.spin = (Math.random() - 0.5) * 12
  }
}

export function clearParticles() {
  for (const p of particles) p.active = false
}
