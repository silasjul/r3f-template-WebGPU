export type FogConfig = {
  enabled: boolean;
  color: string;
  density: number;
};

export const FOG_DEFAULTS: FogConfig = {
  enabled: true,
  color: '#c9b98f',
  density: 0.00399,
};
