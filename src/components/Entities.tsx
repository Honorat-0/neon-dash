import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, CONFIG } from '../game/config'
import { difficulty, runtime } from '../game/runtime'
import { useGameStore } from '../game/store'
import { sfx } from '../game/sfx'
import { emitBurst, clearParticles } from '../game/particles'
import { coinTrail, HALF_EXTENTS, nextPattern, POOL_SIZES, type EntityType, type Pattern } from '../game/patterns'
import { computeScore } from './GameSystem'

interface Entity {
  active: boolean
  x: number
  y: number
  z: number
}

const TYPES: EntityType[] = ['block', 'bar', 'wall', 'coin']

const PLAYER_HALF: [number, number, number] = [0.34, 0.4, 0.34]
const dummy = new THREE.Object3D()

const CYAN: [number, number, number] = [0.3, 0.95, 1]
const GOLD: [number, number, number] = [1, 0.85, 0.3]
const PINK: [number, number, number] = [1, 0.25, 0.6]

function makePool(n: number): Entity[] {
  return Array.from({ length: n }, () => ({ active: false, x: 0, y: 0, z: 0 }))
}

export function Entities() {
  const pools = useMemo(
    () => ({
      block: makePool(POOL_SIZES.block),
      bar: makePool(POOL_SIZES.bar),
      wall: makePool(POOL_SIZES.wall),
      coin: makePool(POOL_SIZES.coin),
    }),
    [],
  )

  const refs = {
    block: useRef<THREE.InstancedMesh>(null!),
    bar: useRef<THREE.InstancedMesh>(null!),
    wall: useRef<THREE.InstancedMesh>(null!),
    coin: useRef<THREE.InstancedMesh>(null!),
  }

  const spawnCursor = useRef(0)
  const gen = useRef(-1)

  const spawn = (type: EntityType, x: number, y: number, z: number) => {
    const pool = pools[type]
    const e = pool.find((p) => !p.active)
    if (!e) return
    e.active = true
    e.x = x
    e.y = y
    e.z = z
  }

  /** Places a pattern with its nearest item at baseZ; the cursor tracks the far end of the pattern. */
  const spawnPattern = (pattern: Pattern, baseZ: number) => {
    for (const item of pattern.items) spawn(item.type, item.x, item.y, baseZ - item.dz)
    spawnCursor.current = baseZ - pattern.length
  }

  const resetAll = () => {
    for (const t of TYPES) for (const e of pools[t]) e.active = false
    clearParticles()
    // warm-up: a gentle coin trail close by, then the regular spawner takes over shortly after
    spawnPattern(coinTrail(), -45)
    spawnCursor.current = CONFIG.SPAWN_Z + 6
  }

  useFrame((state) => {
    const store = useGameStore.getState()
    const phase = store.phase
    const t = state.clock.elapsedTime

    if (gen.current !== runtime.generation) {
      gen.current = runtime.generation
      resetAll()
    }

    const dz = runtime.frameDz

    // --- Move & despawn ---
    for (const type of TYPES) {
      for (const e of pools[type]) {
        if (!e.active) continue
        e.z += dz
        if (e.z > CONFIG.DESPAWN_Z) e.active = false
      }
    }

    // --- Spawn ---
    if (phase === 'playing') {
      spawnCursor.current += dz
      const d = difficulty()
      const reaction = THREE.MathUtils.lerp(1.15, 0.72, d)
      const gap = runtime.speed * reaction
      if (spawnCursor.current > CONFIG.SPAWN_Z + gap) {
        spawnPattern(nextPattern(d), CONFIG.SPAWN_Z)
      }
    }

    // --- Collision ---
    if (phase === 'playing') {
      const px = runtime.playerX
      const py = runtime.playerY + 0.42
      const pz = 0
      const sweep = dz * 0.5 // swept test so thin objects can't tunnel through at high speed / low fps
      let crashed = false

      for (const type of TYPES) {
        const [hx, hy, hz] = HALF_EXTENTS[type]
        for (const e of pools[type]) {
          if (!e.active) continue
          if (Math.abs(e.z - sweep - pz) > hz + PLAYER_HALF[2] + sweep) continue
          if (Math.abs(e.x - px) > hx + PLAYER_HALF[0]) continue
          if (Math.abs(e.y - py) > hy + PLAYER_HALF[1]) continue

          if (type === 'coin') {
            e.active = false
            runtime.coinsThisRun++
            store.addCoin()
            sfx.coin()
            emitBurst(e.x, e.y, e.z, { count: 10, power: 3.5, life: 0.5, size: 0.09, color: GOLD })
          } else {
            crashed = true
          }
        }
        if (crashed) break
      }

      if (crashed) {
        runtime.crashAt = runtime.elapsed
        sfx.crash()
        emitBurst(px, py, pz, { count: 70, power: 9, life: 1.3, size: 0.16, color: CYAN, upward: 3 })
        emitBurst(px, py, pz, { count: 30, power: 6, life: 1.0, size: 0.12, color: PINK, upward: 2 })
        store.gameOver(computeScore())
      }
    }

    // --- Write instance matrices ---
    for (const type of TYPES) {
      const mesh = refs[type].current
      if (!mesh) continue
      const pool = pools[type]
      for (let i = 0; i < pool.length; i++) {
        const e = pool[i]
        if (!e.active) {
          dummy.position.set(0, -50, 0)
          dummy.scale.setScalar(0.0001)
          dummy.rotation.set(0, 0, 0)
        } else {
          dummy.position.set(e.x, e.y, e.z)
          dummy.scale.setScalar(1)
          if (type === 'coin') {
            dummy.rotation.set(0, t * 3 + i * 0.7, 0)
            dummy.position.y = e.y + Math.sin(t * 4 + i) * 0.06
          } else {
            dummy.rotation.set(0, 0, 0)
          }
        }
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Blocks */}
      <instancedMesh ref={refs.block} args={[undefined, undefined, POOL_SIZES.block]} frustumCulled={false} castShadow>
        <boxGeometry args={[1.4, 2.0, 1.2]} />
        <meshStandardMaterial color={COLORS.block} emissive={COLORS.block} emissiveIntensity={1.6} roughness={0.3} metalness={0.2} />
      </instancedMesh>

      {/* Low bars (jump over) */}
      <instancedMesh ref={refs.bar} args={[undefined, undefined, POOL_SIZES.bar]} frustumCulled={false} castShadow>
        <boxGeometry args={[6.4, 0.4, 0.5]} />
        <meshStandardMaterial color={COLORS.bar} emissive={COLORS.bar} emissiveIntensity={1.1} roughness={0.3} metalness={0.2} />
      </instancedMesh>

      {/* Tall walls (dodge) */}
      <instancedMesh ref={refs.wall} args={[undefined, undefined, POOL_SIZES.wall]} frustumCulled={false} castShadow>
        <boxGeometry args={[3.4, 3, 0.6]} />
        <meshStandardMaterial color={COLORS.wall} emissive={COLORS.wall} emissiveIntensity={1.1} roughness={0.35} metalness={0.2} />
      </instancedMesh>

      {/* Coins */}
      <instancedMesh ref={refs.coin} args={[undefined, undefined, POOL_SIZES.coin]} frustumCulled={false}>
        <torusGeometry args={[0.32, 0.11, 10, 24]} />
        <meshStandardMaterial color={COLORS.coin} emissive={COLORS.coin} emissiveIntensity={1.4} roughness={0.2} metalness={0.6} />
      </instancedMesh>
    </group>
  )
}
