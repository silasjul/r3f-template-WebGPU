import { button, useControls } from '@/inspector/useControls';
import { useTweakStore } from '@/stores/tweakStore';

/** Dumps every tweak — right-click the object to copy it back into `configs/`. */
export function useLogButton() {
  useControls({
    'log configs': button(() => {
      const values = Object.fromEntries(
        Object.entries(useTweakStore.getState()).filter(([, value]) => typeof value !== 'function')
      );

      console.log(values);
    }),
  });
}
