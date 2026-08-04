import { create } from 'zustand';
import { CUBE, type CubeConfig } from '@/configs/cubeConfig';
import { LIGHT, type LightConfig } from '@/configs/lightConfig';

/**
 * React's view of `configs/`. The Inspector writes into a config, the folder's `sync`
 * copies it here, and any component reads it with `useTweakStore((s) => s.cube)`.
 */
interface TweakState {
  cube: CubeConfig;
  syncCube: () => void;
  light: LightConfig;
  syncLight: () => void;
}

export const useTweakStore = create<TweakState>((set) => ({
  cube: { ...CUBE },
  syncCube: () => set({ cube: { ...CUBE } }),
  light: { ...LIGHT },
  syncLight: () => set({ light: { ...LIGHT } }),
}));
