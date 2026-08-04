import { useSceneSelect } from '@/hooks/inspector/useSceneSelect';
import { useFogTweaks } from '@/hooks/inspector/useFogTweaks';
import { useLogButton } from '@/hooks/inspector/useLogButton';

/**
 * Lives inside the Canvas because the panel hangs off the renderer. Holds only the
 * controls that outlive a scene swap — per-scene folders belong to the scene itself.
 */
export default function Tweaks() {
  useSceneSelect();
  useFogTweaks();
  useLogButton();

  return null;
}
