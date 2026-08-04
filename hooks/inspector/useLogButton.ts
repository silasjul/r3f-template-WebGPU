import { useCallback } from 'react';
import { useTweakStore } from '@/stores/tweakStore';
import { useTweakButton } from '@/hooks/inspector/useTweaks';

export function useLogButton() {
  const log = useCallback(() => {
    const values = Object.fromEntries(
      Object.entries(useTweakStore.getState()).filter(([, value]) => typeof value !== 'function')
    );

    console.log(values);
  }, []);

  useTweakButton('Log values', log);
}
