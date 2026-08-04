export type LightConfig = {
  sunColor: string;
  intensity: number;
  height: number;
  skyColor: string;
  groundColor: string;
  ambient: number;
};

export const LIGHT: LightConfig = {
  sunColor: '#ffd9a0',
  intensity: 2.4,
  height: 24,
  skyColor: '#cdd8ff',
  groundColor: '#6b5a3a',
  ambient: 0.6,
};
