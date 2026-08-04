import { useCubeTweaks } from '@/hooks/tweaks/useCubeTweaks';
import { useLightTweaks } from '@/hooks/tweaks/useLightTweaks';
import { useParametersToggle } from '@/hooks/tweaks/useParametersToggle';
import { useLogButton } from '@/hooks/tweaks/useLogButton';

/**
 * Every folder in the panel, declared in one place. Consumers never come here — they
 * read `useTweakStore` from wherever they live.
 *
 * Must be inside the Canvas: `useParameters` reaches the Inspector through the renderer.
 */
export default function InspectorControls() {
  useCubeTweaks();
  useLightTweaks();

  useParametersToggle();
  useLogButton();

  return null;
}
