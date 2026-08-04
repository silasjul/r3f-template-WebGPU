import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardNodeMaterial } from 'three/webgpu';
import { CUBE_DEFAULTS, type CubeConfig } from '@/configs/cubeConfig';
import { useTweaks, type TweakSchema } from '@/hooks/inspector/useTweaks';
import { useTweakStore } from '@/stores/tweakStore';

const SCHEMA: TweakSchema<CubeConfig> = {
  color: { color: true },
  size: { min: 1, max: 40, step: 0.5 },
  spin: { min: 0, max: 3, step: 0.05 },
};

/**
 * Both tweak channels in one folder: colour, spin and wireframe are pushed straight
 * onto three.js objects and render nothing in React, while size goes through the
 * store because the geometry has to be rebuilt.
 */
export default function CubeScene() {
  const mesh = useRef<Mesh>(null);
  const spin = useRef(CUBE_DEFAULTS.spin);

  const size = useTweakStore((s) => s.cubeSize);
  const setCubeSize = useTweakStore((s) => s.setCubeSize);

  const apply = useCallback(
    (values: CubeConfig) => {
      spin.current = values.spin;

      const material = mesh.current?.material as MeshStandardNodeMaterial | undefined;

      if (material) {
        material.color.set(values.color);
        material.wireframe = values.wireframe;
      }

      // A no-op for subscribers unless the number actually changed.
      setCubeSize(values.size);
    },
    [setCubeSize]
  );

  useTweaks('Cube', CUBE_DEFAULTS, SCHEMA, apply);

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * spin.current;
  });

  return (
    <mesh ref={mesh} position={[0, size / 2, 0]}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardNodeMaterial color={CUBE_DEFAULTS.color} roughness={0.6} />
    </mesh>
  );
}
