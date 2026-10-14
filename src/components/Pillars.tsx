import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../game/config'
import { runtime } from '../game/runtime'

const COUNT = 56
const FAR_Z = -160
const NEAR_Z = 18

interface Pillar {
  x: number
  z: number
  h: number
  w: number
  d: number
  color: number
}

const CAP_COLORS = [new THREE.Color(COLORS.cyan), new THREE.Color(COLORS.magenta), new THREE.Color(COLORS.purple)]
const BODY_COLORS = [new THREE.Color('#141038'), new THREE.Color('#1c0f3a'), new THREE.Color('#0f1540')]

const dummy = new THREE.Object3D()

function randomize(p: Pillar, side: number) {
  p.x = side * (5.5 + Math.random() * 11)
  p.h = 0.8 + Math.pow(Math.random(), 2.2) * 16
  p.w = 0.8 + Math.random() * 2.2
  p.d = 0.8 + Math.random() * 2.2
  p.color = Math.floor(Math.random() * CAP_COLORS.length)
}

export function Pillars() {
  const body = useRef<THREE.InstancedMesh>(null!)
  const cap = useRef<THREE.InstancedMesh>(null!)

  const pillars = useMemo<Pillar[]>(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const p: Pillar = { x: 0, z: 0, h: 1, w: 1, d: 1, color: 0 }
      randomize(p, i % 2 === 0 ? -1 : 1)
      p.z = FAR_Z + ((i / COUNT) * (NEAR_Z - FAR_Z) + Math.random() * 4)
      return p
    })
  }, [])

  const applyColors = () => {
    pillars.forEach((p, i) => {
      cap.current.setColorAt(i, CAP_COLORS[p.color])
      body.current.setColorAt(i, BODY_COLORS[p.color])
    })
    if (cap.current.instanceColor) cap.current.instanceColor.needsUpdate = true
    if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true
  }

  useLayoutEffect(() => {
    applyColors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    const dz = runtime.frameDz
    let colorsDirty = false

    for (let i = 0; i < COUNT; i++) {
      const p = pillars[i]
      p.z += dz
      if (p.z > NEAR_Z) {
        randomize(p, p.x < 0 ? -1 : 1)
        p.z = FAR_Z - Math.random() * 12
        cap.current.setColorAt(i, CAP_COLORS[p.color])
        body.current.setColorAt(i, BODY_COLORS[p.color])
        colorsDirty = true
      }

      dummy.position.set(p.x, p.h / 2, p.z)
      dummy.scale.set(p.w, p.h, p.d)
      dummy.updateMatrix()
      body.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(p.x, p.h + 0.04, p.z)
      dummy.scale.set(p.w + 0.15, 0.08, p.d + 0.15)
      dummy.updateMatrix()
      cap.current.setMatrixAt(i, dummy.matrix)
    }

    body.current.instanceMatrix.needsUpdate = true
    cap.current.instanceMatrix.needsUpdate = true
    if (colorsDirty) {
      if (cap.current.instanceColor) cap.current.instanceColor.needsUpdate = true
      if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} metalness={0.3} emissive="#1a0a3a" emissiveIntensity={0.35} />
      </instancedMesh>
      <instancedMesh ref={cap} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
