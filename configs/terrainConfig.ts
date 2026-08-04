/** The fields that actually define the height field — anything sampling the ground needs only these. */
export type TerrainShape = {
  seed: number;
  scale: number;
  height: number;
  octaves: number;
  lacunarity: number;
  persistence: number;
  warp: number;
};

export type TerrainConfig = TerrainShape & {
  size: number;
  segments: number;
  color: string;
  slopeColor: string;
  wireframe: boolean;
};

export const TERRAIN_DEFAULTS: TerrainConfig = {
  seed: 5704,
  scale: 90,
  height: 6.5,
  octaves: 1,
  lacunarity: 1.7,
  persistence: 0,
  warp: 0,
  size: 250,
  segments: 80,
  color: '#b09863',
  slopeColor: '#6b5637',
  wireframe: false,
};
