import { create } from 'zustand';
import { CUBE } from '@/configs/cubeConfig';
import { LIGHT } from '@/configs/lightConfig';

/**
 * Every tweakable domain. Adding one here is the whole registration step — the store's
 * shape, its types and the save button all follow from it.
 */
export const CONFIGS = {
  light: LIGHT,
  cube: CUBE,
};

export type TweakState = typeof CONFIGS;

/**
 * React's view of the configs: the Inspector writes into a config, `syncConfig` copies
 * it here, and any component reads it with `useTweakStore((s) => s.cube)`.
 */
export const useTweakStore = create<TweakState>()(
  // Deep clone, not a spread: a spread would leave every slice pointing at the config
  // the Inspector mutates, so state would change behind React's back and `syncConfig`
  // would then set an identical reference that wakes nobody.
  () => structuredClone(CONFIGS)
);

/** Copies a config into the store, re-rendering whatever reads that slice. */
export function syncConfig<K extends keyof TweakState>(name: K) {
  useTweakStore.setState({ [name]: { ...CONFIGS[name] } } as Pick<TweakState, K>);
}
