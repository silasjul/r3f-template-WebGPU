import { SCENES } from '@/components/scenes/registry';
import { useTweakStore } from '@/stores/tweakStore';

/** Swapping this unmounts the old scene's folders and builds the new one's. */
export default function ActiveScene() {
  const sceneId = useTweakStore((s) => s.sceneId);
  const { Component } = SCENES[sceneId];

  return <Component />;
}
