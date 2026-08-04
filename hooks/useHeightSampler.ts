import { useMemo } from 'react';
import { createHeightSampler, type HeightSampler } from '@/lib/terrain';
import { useTweakStore } from '@/stores/tweakStore';

/** Only rebuilds when the height field itself changes, not on cosmetic tweaks. */
export function useHeightSampler(): HeightSampler {
  const { seed, scale, height, octaves, lacunarity, persistence, warp } = useTweakStore(
    (s) => s.terrain
  );

  return useMemo(
    () => createHeightSampler({ seed, scale, height, octaves, lacunarity, persistence, warp }),
    [seed, scale, height, octaves, lacunarity, persistence, warp]
  );
}
