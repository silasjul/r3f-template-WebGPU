import type { ComponentType } from 'react';
import TerrainScene from '@/components/scenes/terrain/TerrainScene';
import CubeScene from '@/components/scenes/cube/CubeScene';

/** Each entry owns its own folder — they mount and unmount with the scene. */
export const SCENES = {
  terrain: { label: 'Terrain', Component: TerrainScene },
  cube: { label: 'Cube', Component: CubeScene },
} satisfies Record<string, { label: string; Component: ComponentType }>;

export type SceneId = keyof typeof SCENES;

export const SCENE_OPTIONS = Object.fromEntries(
  Object.entries(SCENES).map(([id, { label }]) => [label, id])
) as Record<string, SceneId>;
