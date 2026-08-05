'use client';

import { useCubeTweaks } from '@/hooks/useCubeTweaks';
import { useLightTweaks } from '@/hooks/useLightTweaks';
import { useLogButton } from '@/hooks/useLogButton';
import { useParametersToggle } from '@/inspector/useParametersToggle';

/**
 * Every folder in the panel, declared in one place. Consumers never come here — they read
 * `useTweakStore` from wherever they live.
 *
 * Mounted beside the Canvas, not inside it, so a Canvas re-render never touches the panel.
 * `useParametersToggle` has to stay last — see its own note.
 */
export default function InspectorControls() {
  useCubeTweaks();
  useLightTweaks();

  useParametersToggle();
  useLogButton();

  return null;
}
