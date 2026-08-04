import { useCallback } from 'react';
import { useParameterButton } from '@/hooks/useParameters';
import { useTweakStore } from '@/stores/tweakStore';

/** Dumps every tweak — right-click the object to copy it back into `configs/`. */
export function useLogButton() {
  const log = useCallback(() => {
    const values = Object.fromEntries(
      Object.entries(useTweakStore.getState()).filter(([, value]) => typeof value !== 'function')
    );

    console.log(values);
  }, []);

  useParameterButton('log configs', log);
}
