export type LightConfig = {
  /** Directional light — parallel rays from one direction. The only one that can cast shadows. */
  color: string;
  intensity: number;
  /** Its Y position; X and Z are fixed in `Light`. */
  height: number;
  /**
   * Hemisphere light — fill that blends by surface normal: `upColor` on faces pointing
   * up, `downColor` on faces pointing down, so nothing ends up pure black.
   */
  upColor: string;
  downColor: string;
  fill: number;
};

export const LIGHT: LightConfig = {
  color: '#ffd9a0',
  intensity: 2.4,
  height: 24,
  upColor: '#cdd8ff',
  downColor: '#6b5a3a',
  fill: 0.6,
};
