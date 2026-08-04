import { useTweakStore } from '@/stores/tweakStore';
import { SCENE_OPTIONS } from '@/components/scenes/registry';
import { useTweakSelect } from '@/hooks/inspector/useTweaks';

export function useSceneSelect() {
  const sceneId = useTweakStore((s) => s.sceneId);
  const setSceneId = useTweakStore((s) => s.setSceneId);

  useTweakSelect('Scene', SCENE_OPTIONS, sceneId, setSceneId);
}
