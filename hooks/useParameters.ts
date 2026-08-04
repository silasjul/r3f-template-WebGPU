import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { addButton, addFolder, getInspector } from '@/lib/inspector';
import type { ParametersGroup } from 'three/addons/inspector/tabs/Parameters.js';

export type { ParametersGroup };

/**
 * Builds one folder in the Inspector's Parameters tab, and removes it again when the
 * component unmounts — folders live and die with whatever owns them.
 *
 * A row binds to a live object and writes straight back into it, so
 * `group.add(CUBE, 'size', 1, 40, 0.5)` already sets `CUBE.size`; chain
 * `.onChange(sync)` to push that into the store.
 *
 * `build` runs once, since the Inspector owns the values from then on. In production
 * the Inspector is never attached, so this no-ops.
 */
export function useParameters(name: string, build: (group: ParametersGroup) => void) {
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    return addFolder(inspector, name, build);
    // `build` runs once by design, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, name]);
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
