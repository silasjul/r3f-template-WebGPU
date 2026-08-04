import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three/webgpu';
import { useTweakStore } from '@/stores/tweakStore';

export default function Cube() {
  const mesh = useRef<Mesh>(null!);
  const { color, size, spin, wireframe } = useTweakStore((s) => s.cube);

  useFrame((_, delta) => {
    mesh.current.rotation.y += delta * spin;
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardNodeMaterial color={color} wireframe={wireframe} roughness={0.6} />
    </mesh>
  );
}
