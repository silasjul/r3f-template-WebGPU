import { useSceneTweaks } from '@/hooks/tweaks/useSceneTweaks';
import { useFogTweaks } from '@/hooks/tweaks/useFogTweaks';
import { useLightTweaks } from '@/hooks/tweaks/useLightTweaks';
import { useInspectorToggle } from '@/hooks/tweaks/useInspectorToggle';
import { useLogButton } from '@/hooks/tweaks/useLogButton';

/**
 * Every folder that outlives a scene swap. Consumers never come here — they read the
 * store, from wherever they happen to live.
 */
export default function Tweaks() {
  useSceneTweaks();
  useFogTweaks();
  useLightTweaks();
  useInspectorToggle();
  useLogButton();

  return null;
}
