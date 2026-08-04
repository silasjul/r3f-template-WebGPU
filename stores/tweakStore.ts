import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CUBE } from '@/configs/cubeConfig';
import { FOG } from '@/configs/fogConfig';
import { LIGHT } from '@/configs/lightConfig';
import { TERRAIN_LOOK, TERRAIN_SHAPE } from '@/configs/terrainConfig';
// Type-only on purpose: a value import here would close a require cycle
// (store → registry → scenes → tweak hooks → store).
import type { SceneId } from '@/components/scenes/registry';

/**
 * Every tweakable domain. Adding one here is the whole registration step — the store's
 * shape, its types and the save button all follow from it.
 */
export const CONFIGS = {
  fog: FOG,
  light: LIGHT,
  cube: CUBE,
  terrainShape: TERRAIN_SHAPE,
  terrainLook: TERRAIN_LOOK,
};

type Configs = typeof CONFIGS;

export type TweakState = Configs & { sceneId: SceneId };

/**
 * React's view of the configs. The Inspector writes into a config, `syncConfig` copies
 * it here, and any component reads it from here — with `useTweakStore` to re-render, or
 * `useTweakEffect` not to.
 */
export const useTweakStore = create<TweakState>()(
  subscribeWithSelector(() => ({
    ...structuredClone(CONFIGS),
    sceneId: 'terrain' as SceneId,
  }))
);

/** Copies a config into the store, waking whatever reads that slice. */
export function syncConfig<K extends keyof Configs>(name: K) {
  useTweakStore.setState({ [name]: { ...CONFIGS[name] } } as Pick<Configs, K>);
}

export function setSceneId(sceneId: SceneId) {
  useTweakStore.setState({ sceneId });
}
