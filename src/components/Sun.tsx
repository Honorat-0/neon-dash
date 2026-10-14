import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float r = length(uv);
    if (r > 1.0) discard;

    float t = uv.y * 0.5 + 0.5;
    vec3 bottom = vec3(1.0, 0.16, 0.55);
    vec3 top = vec3(1.0, 0.86, 0.35);
    vec3 col = mix(bottom, top, smoothstep(0.0, 1.0, t));

    // classic retro stripes that thicken toward the horizon, slowly drifting
    float y = uv.y + uTime * 0.03;
    float s = fract(y * 7.0);
    float cut = (0.25 - uv.y) * 0.75;
    if (uv.y < 0.25 && s < cut) discard;

    float alpha = 1.0 - smoothstep(0.96, 1.0, r);
    gl_FragColor = vec4(col * 1.6, alpha);
  }
`

export function Sun() {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((state) => {
    mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group position={[0, 14, -230]}>
      {/* soft halo */}
      <mesh position={[0, 0, -2]}>
        <circleGeometry args={[52, 64]} />
        <meshBasicMaterial color="#ff2d95" transparent opacity={0.12} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[36, 96]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
