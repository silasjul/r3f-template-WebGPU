import { useEffect, useMemo } from 'react';
import { Color } from 'three/webgpu';
import { mix, normalWorld, smoothstep, uniform } from 'three/tsl';
import { buildTerrainGeometry } from '@/lib/terrain';
import { useHeightSampler } from '@/hooks/useHeightSampler';
import { useTweakStore } from '@/stores/tweakStore';

export default function Terrain() {
  const { size, segments, color, slopeColor, wireframe } = useTweakStore((s) => s.terrain);
  const sample = useHeightSampler();

  const geometry = useMemo(
    () => buildTerrainGeometry(size, segments, sample),
    [size, segments, sample]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  const { colorNode, flatUniform, slopeUniform } = useMemo(() => {
    const flatUniform = uniform(new Color());
    const slopeUniform = uniform(new Color());
    const flatness = smoothstep(0.6, 0.92, normalWorld.y);

    return { colorNode: mix(slopeUniform, flatUniform, flatness), flatUniform, slopeUniform };
  }, []);

  useEffect(() => {
    flatUniform.value.set(color);
    slopeUniform.value.set(slopeColor);
  }, [flatUniform, slopeUniform, color, slopeColor]);

  return (
    <mesh geometry={geometry}>
      <meshStandardNodeMaterial
        colorNode={colorNode}
        roughness={1}
        metalness={0}
        wireframe={wireframe}
      />
    </mesh>
  );
}
