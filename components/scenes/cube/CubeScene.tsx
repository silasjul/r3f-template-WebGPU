import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardNodeMaterial } from 'three/webgpu';
import { useCubeTweaks } from '@/components/scenes/cube/useCubeTweaks';
import { useTweakEffect } from '@/hooks/useTweakEffect';
import { useTweakStore } from '@/stores/tweakStore';

export default function CubeScene() {
  useCubeTweaks();

  const mesh = useRef<Mesh>(null!);
  const material = useRef<MeshStandardNodeMaterial>(null!);

  // Rebuilds the geometry, so this one has to reach React.
  const size = useTweakStore((s) => s.cube.size);

  useTweakEffect(
    (s) => s.cube,
    ({ color, wireframe }) => {
      material.current.color.set(color);
      material.current.wireframe = wireframe;
    }
  );

  useFrame((_, delta) => {
    mesh.current.rotation.y += delta * useTweakStore.getState().cube.spin;
  });

  return (
    <mesh ref={mesh} position={[0, size / 2, 0]}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardNodeMaterial ref={material} roughness={0.6} />
    </mesh>
  );
}
