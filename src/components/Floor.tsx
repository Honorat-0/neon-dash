import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, CONFIG } from '../game/config'
import { runtime } from '../game/runtime'

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uOffset;
  uniform vec3 uLine;
  uniform vec3 uLine2;
  uniform vec3 uBase;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uPulse;
  varying vec3 vWorld;

  float gridLine(vec2 p) {
    vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    float l = min(g.x, g.y);
    return 1.0 - min(l, 1.0);
  }

  void main() {
    // lane boundaries sit at odd x values; z lines every 2 units and scroll with the world
    vec2 p = vec2((vWorld.x - 1.0) * 0.5, (vWorld.z + uOffset) * 0.5);
    float l = gridLine(p);

    float track = 1.0 - step(3.2, abs(vWorld.x));
    vec3 base = mix(uBase, uBase * 2.2 + vec3(0.03, 0.0, 0.06), track);
    vec3 lineCol = mix(uLine2, uLine, track);

    // gentle travelling pulse down the track
    float pulse = 0.5 + 0.5 * sin(vWorld.z * 0.08 + uPulse);
    lineCol *= 0.75 + 0.5 * pulse;

    vec3 col = mix(base, lineCol, l * 0.95);

    // edge glow near the rails
    float edge = smoothstep(0.9, 0.0, abs(abs(vWorld.x) - 3.3));
    col += uLine * edge * 0.25;

    float dist = length(vWorld - cameraPosition);
    float f = smoothstep(uFogNear, uFogFar, dist);
    col = mix(col, uFogColor, f);
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Floor() {
  const mat = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(
    () => ({
      uOffset: { value: 0 },
      uPulse: { value: 0 },
      uLine: { value: new THREE.Color(COLORS.cyan).multiplyScalar(0.9) },
      uLine2: { value: new THREE.Color('#5b3df5').multiplyScalar(0.55) },
      uBase: { value: new THREE.Color('#06030f') },
      uFogColor: { value: new THREE.Color(CONFIG.FOG_COLOR) },
      uFogNear: { value: CONFIG.FOG_NEAR },
      uFogFar: { value: CONFIG.FOG_FAR },
    }),
    [],
  )

  useFrame((state) => {
    const u = mat.current.uniforms
    // lines move toward the camera (+z): offset decreases, wrapped to the 2-unit cell size
    u.uOffset.value = (((u.uOffset.value - runtime.frameDz) % 2) + 2) % 2
    u.uPulse.value = state.clock.elapsedTime * 2.5
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -120]} receiveShadow>
        <planeGeometry args={[80, 320]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </mesh>

      {/* Neon rails along the track edges */}
      {[-3.35, 3.35].map((x) => (
        <mesh key={x} position={[x, 0.06, -100]}>
          <boxGeometry args={[0.1, 0.12, 300]} />
          <meshBasicMaterial color={COLORS.cyan} toneMapped={false} />
        </mesh>
      ))}
      {[-3.35, 3.35].map((x) => (
        <mesh key={`glow-${x}`} position={[x, 0.03, -100]}>
          <boxGeometry args={[0.5, 0.02, 300]} />
          <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.12} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
