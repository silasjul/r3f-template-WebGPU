import { create } from 'zustand';
import { TERRAIN_DEFAULTS, type TerrainConfig } from '@/configs/terrainConfig';
import { FOG_DEFAULTS, type FogConfig } from '@/configs/fogConfig';
import { CUBE_DEFAULTS } from '@/configs/cubeConfig';
import type { SceneId } from '@/components/scenes/registry';

/**
 * Only values that have to reach React belong here. Anything a scene can push
 * straight onto a three.js object should stay out — see `CubeScene`.
 */
interface TweakState {
  sceneId: SceneId;
  setSceneId: (sceneId: SceneId) => void;
  terrain: TerrainConfig;
  setTerrain: (terrain: TerrainConfig) => void;
  fog: FogConfig;
  setFog: (fog: FogConfig) => void;
  /** Only the cube field that rebuilds geometry; colour and spin never re-render. */
  cubeSize: number;
  setCubeSize: (cubeSize: number) => void;
}

export const useTweakStore = create<TweakState>((set) => ({
  sceneId: 'terrain',
  setSceneId: (sceneId) => set({ sceneId }),
  terrain: TERRAIN_DEFAULTS,
  setTerrain: (terrain) => set({ terrain }),
  fog: FOG_DEFAULTS,
  setFog: (fog) => set({ fog }),
  cubeSize: CUBE_DEFAULTS.size,
  setCubeSize: (cubeSize) => set({ cubeSize }),
}));
