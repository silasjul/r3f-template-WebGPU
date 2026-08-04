import { useCallback } from 'react';
import { useParameterButton } from '@/hooks/useParameters';
import { CONFIGS } from '@/stores/tweakStore';

/**
 * Dumps every config — right-click the object to copy it back into `configs/`.
 * Cloned because devtools reads a logged object lazily, so a live one would show
 * whatever it was mutated to after the click rather than the values you captured.
 */
export function useLogButton() {
  const log = useCallback(() => console.log(structuredClone(CONFIGS)), []);

  useParameterButton('log configs', log);
}
