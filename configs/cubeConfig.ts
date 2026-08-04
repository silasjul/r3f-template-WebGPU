export type CubeConfig = {
  color: string;
  size: number;
  spin: number;
  wireframe: boolean;
};

export const CUBE_DEFAULTS: CubeConfig = {
  color: '#c98f5a',
  size: 12,
  spin: 0.3,
  wireframe: false,
};
