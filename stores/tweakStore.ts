import { create } from 'zustand';
import { CUBE_DEFAULTS, type CubeConfig } from '@/configs/cubeConfig';
import { LIGHT_DEFAULTS, type LightConfig } from '@/configs/lightConfig';

/**
 * React's view of the panel. A tweak hook mirrors what `useControls` returned into here, and any
 * component reads it with `useTweakStore((s) => s.cube)` — so the Canvas can re-render freely
 * without the panel ever seeing it.
 */
interface TweakState {
  cube: CubeConfig;
  setCube: (cube: CubeConfig) => void;
  light: LightConfig;
  setLight: (light: LightConfig) => void;
}

export const useTweakStore = create<TweakState>((set) => ({
  cube: CUBE_DEFAULTS,
  setCube: (cube) => set({ cube }),
  light: LIGHT_DEFAULTS,
  setLight: (light) => set({ light }),
}));
