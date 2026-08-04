import { useEffect, useMemo, useRef } from 'react';
import type { MeshStandardNodeMaterial } from 'three/webgpu';
import { buildTerrainGeometry, createHeightSampler, createTerrainShading } from '@/lib/terrain';
import { useTerrainTweaks } from '@/components/scenes/terrain/useTerrainTweaks';
import { useTweakEffect } from '@/hooks/useTweakEffect';
import { useTweakStore } from '@/stores/tweakStore';

export default function TerrainScene() {
  useTerrainTweaks();

  const material = useRef<MeshStandardNodeMaterial>(null!);
  const { colorNode, flat, slope } = useMemo(() => createTerrainShading(), []);

  // Rebuilds the geometry, so this one has to reach React.
  const shape = useTweakStore((s) => s.terrainShape);

  useTweakEffect(
    (s) => s.terrainLook,
    (look) => {
      flat.set(look.color);
      slope.set(look.slopeColor);
      material.current.wireframe = look.wireframe;
    }
  );

  const geometry = useMemo(
    () => buildTerrainGeometry(shape.size, shape.segments, createHeightSampler(shape)),
    [shape]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardNodeMaterial ref={material} colorNode={colorNode} roughness={1} metalness={0} />
    </mesh>
  );
}
