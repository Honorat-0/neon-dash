import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { AIR_TIME, COLORS, CONFIG } from '../game/config'
import { laneX, runtime } from '../game/runtime'
import { useGameStore } from '../game/store'
import { sfx } from '../game/sfx'

export function Player() {
  const group = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const core = useRef<THREE.Mesh>(null!)
  const shadow = useRef<THREE.Mesh>(null!)
  const light = useRef<THREE.PointLight>(null!)

  const x = useRef(0)
  const y = useRef(0)
  const vy = useRef(0)
  const flip = useRef(0)
  const squash = useRef(0)
  const gen = useRef(runtime.generation)
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.86, 0.86, 0.86)), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const phase = useGameStore.getState().phase
    const t = state.clock.elapsedTime

    if (gen.current !== runtime.generation) {
      gen.current = runtime.generation
      x.current = 0
      y.current = 0
      vy.current = 0
      flip.current = 0
      squash.current = 0
    }

    if (phase === 'paused') return

    // --- Lane movement ---
    const targetX = laneX(runtime.lane)
    x.current = THREE.MathUtils.damp(x.current, targetX, 14, dt)

    // --- Jumping ---
    if (phase === 'playing') {
      const wantsJump = runtime.jumpQueuedAt >= 0 && runtime.elapsed - runtime.jumpQueuedAt <= CONFIG.JUMP_BUFFER
      if (wantsJump && runtime.grounded) {
        vy.current = CONFIG.JUMP_VELOCITY
        runtime.grounded = false
        runtime.jumpQueuedAt = -1
        flip.current = 0
        sfx.jump()
      }
      if (!runtime.grounded) {
        vy.current += CONFIG.GRAVITY * dt
        y.current += vy.current * dt
        flip.current = Math.min(1, flip.current + dt / AIR_TIME)
        if (y.current <= 0) {
          y.current = 0
          vy.current = 0
          runtime.grounded = true
          squash.current = 1
          flip.current = 0
          sfx.land()
        }
      }
    } else if (phase === 'menu') {
      // idle hover
      y.current = 0.08 + Math.sin(t * 2.2) * 0.08
    }

    squash.current = THREE.MathUtils.damp(squash.current, 0, 10, dt)

    runtime.playerX = x.current
    runtime.playerY = y.current

    // --- Visuals ---
    const crashed = phase === 'gameover'
    group.current.visible = !crashed
    group.current.position.set(x.current, y.current + 0.42, 0)

    // bank into lane changes
    const bank = THREE.MathUtils.clamp((x.current - targetX) * 0.55, -0.6, 0.6)
    body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, bank, 12, dt)

    // front flip during jumps
    const targetFlip = runtime.grounded ? 0 : -flip.current * Math.PI * 2
    body.current.rotation.x = runtime.grounded ? THREE.MathUtils.damp(body.current.rotation.x, 0, 20, dt) : targetFlip

    // landing squash
    const s = squash.current
    body.current.scale.set(1 + s * 0.25, 1 - s * 0.3, 1 + s * 0.25)

    // spinning inner core
    core.current.rotation.y = t * 2.5
    core.current.rotation.x = t * 1.7

    // ground shadow ring (stays on the floor so the player can judge landings)
    const sh = Math.max(0.3, 1 - y.current / 2.4)
    shadow.current.position.set(x.current, 0.02, 0)
    shadow.current.scale.setScalar(sh)
    shadow.current.visible = !crashed
    const shadowMat = shadow.current.material as THREE.MeshBasicMaterial
    shadowMat.opacity = 0.35 * sh + 0.15

    light.current.intensity = 26 + Math.sin(t * 8) * 4
  })

  return (
    <>
      <group ref={group}>
        <group ref={body}>
          <RoundedBox args={[0.84, 0.84, 0.84]} radius={0.16} smoothness={4} castShadow>
            <meshStandardMaterial
              color={COLORS.player}
              emissive={COLORS.playerEmissive}
              emissiveIntensity={0.55}
              roughness={0.15}
              metalness={0.4}
              transparent
              opacity={0.85}
            />
          </RoundedBox>
          <mesh ref={core}>
            <octahedronGeometry args={[0.34, 0]} />
            <meshBasicMaterial color="#e0ffff" toneMapped={false} />
          </mesh>
          {/* glowing edge frame */}
          <lineSegments geometry={edgeGeometry}>
            <lineBasicMaterial color={COLORS.cyan} toneMapped={false} transparent opacity={0.9} />
          </lineSegments>
        </group>
        <pointLight ref={light} color={COLORS.cyan} intensity={26} distance={9} decay={2} />
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.55, 32]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.5} toneMapped={false} depthWrite={false} />
      </mesh>
    </>
  )
}
