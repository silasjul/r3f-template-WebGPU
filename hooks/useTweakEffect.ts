import { useLayoutEffect } from 'react';
import { useTweakStore, type TweakState } from '@/stores/tweakStore';

/**
 * Reads the store **without subscribing React to it**. `apply` runs once on mount and
 * again whenever the selected slice changes, outside the render cycle — so nothing
 * re-renders and the next frame just draws differently.
 *
 * Use it whenever a tweak only has to land on a three.js object. Use `useTweakStore`
 * instead when the value has to change the React tree, e.g. geometry that is rebuilt.
 *
 * Layout, not passive: the first `apply` has to beat the renderer's first frame, or an
 * object briefly draws with its constructor defaults.
 */
export function useTweakEffect<T>(select: (state: TweakState) => T, apply: (value: T) => void) {
  useLayoutEffect(() => {
    apply(select(useTweakStore.getState()));

    return useTweakStore.subscribe(select, apply);
    // Runs once, like `useParameters` — `select` and `apply` are treated as stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
