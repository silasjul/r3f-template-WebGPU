/** Split from the look because a change here rebuilds the geometry. */
export type TerrainShapeConfig = {
  seed: number;
  scale: number;
  height: number;
  octaves: number;
  lacunarity: number;
  persistence: number;
  warp: number;
  size: number;
  segments: number;
};

export type TerrainLookConfig = {
  color: string;
  slopeColor: string;
  wireframe: boolean;
};

export const TERRAIN_SHAPE: TerrainShapeConfig = {
  seed: 5704,
  scale: 90,
  height: 6.5,
  octaves: 1,
  lacunarity: 1.7,
  persistence: 0,
  warp: 0,
  size: 250,
  segments: 80,
};

export const TERRAIN_LOOK: TerrainLookConfig = {
  color: '#b09863',
  slopeColor: '#6b5637',
  wireframe: false,
};
