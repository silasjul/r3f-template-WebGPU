import { TERRAIN_DEFAULTS, type TerrainConfig } from '@/configs/terrainConfig';
import { useTweakStore } from '@/stores/tweakStore';
import { useTweaks, type TweakSchema } from '@/hooks/inspector/useTweaks';

const SCHEMA: TweakSchema<TerrainConfig> = {
  seed: { min: 0, max: 9999, step: 1 },
  scale: { min: 5, max: 300, step: 1 },
  height: { min: 0, max: 40, step: 0.1 },
  octaves: { min: 1, max: 8, step: 1 },
  lacunarity: { min: 1, max: 4, step: 0.05 },
  persistence: { min: 0, max: 1, step: 0.01 },
  warp: { min: 0, max: 2, step: 0.01 },
  size: { min: 20, max: 600, step: 10 },
  segments: { min: 16, max: 400, step: 8 },
  color: { color: true },
  slopeColor: { color: true, label: 'slope color' },
};

export function useTerrainTweaks() {
  const setTerrain = useTweakStore((s) => s.setTerrain);

  useTweaks('Terrain', TERRAIN_DEFAULTS, SCHEMA, setTerrain);
}
