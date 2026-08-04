import { SCENE_OPTIONS } from '@/components/scenes/registry';
import { useParameters } from '@/hooks/useParameters';
import { setSceneId, useTweakStore } from '@/stores/tweakStore';

/** Not config-backed: which scene is open is session state, not a saved look. */
export function useSceneTweaks() {
  useParameters('Scene', (group) => {
    // Read once rather than subscribed — the Inspector owns the value after mount.
    const scene = useTweakStore.getState().sceneId;

    group.add({ scene }, 'scene', SCENE_OPTIONS).onChange(setSceneId);
  });
}
