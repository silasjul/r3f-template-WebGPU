import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { addButton, addFolder, getInspector } from '@/lib/inspector';
import type { ParametersGroup } from 'three/addons/inspector/tabs/Parameters.js';

export type { ParametersGroup };

/**
 * Builds one folder in the Inspector's Parameters tab, and removes it again when the
 * component unmounts — folders live and die with whatever owns them.
 *
 * Rows bind to a live object and write straight back into it, so `group.add(FOG,
 * 'density', 0, 0.06, 0.0005)` already sets `FOG.density`; chain `.onChange(sync)` to
 * push that into the store. In production the Inspector is never attached, so this no-ops.
 *
 * `build` runs once, since the Inspector owns the values from then on. Pass `key` to
 * rebuild the folder when it has to bind to a different object.
 */
export function useParameters(
  name: string,
  build: (group: ParametersGroup) => void,
  key?: unknown
) {
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    return addFolder(inspector, name, build);
    // `build` is deliberately not a dependency — `key` is the opt-in rebuild signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, name, key]);
}

/** A bare button pinned below the folders. Pass a `useCallback`'d handler. */
export function useParameterButton(label: string, onClick: () => void) {
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    return addButton(inspector, label, onClick);
  }, [renderer, label, onClick]);
}
