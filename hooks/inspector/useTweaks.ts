import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import {
  buildButton,
  buildFolder,
  buildSelect,
  getInspector,
  type TweakFolderOptions,
  type TweakSchema,
} from '@/lib/inspector/parameters';

export type { TweakOptions, TweakSchema, TweakFolderOptions } from '@/lib/inspector/parameters';

/**
 * Builds one Parameters folder and calls `onChange` with the full values on every
 * edit. What `onChange` does decides whether React is involved: a store setter
 * re-renders subscribers, a direct three.js mutation renders nothing.
 *
 * Pass module-level `defaults`/`schema` and a stable `onChange` — when any of them
 * change identity the folder is torn down and rebuilt, which is how scenes swap.
 */
export function useTweaks<T extends Record<string, unknown>>(
  folder: string,
  defaults: T,
  schema: TweakSchema<T>,
  onChange: (values: T) => void,
  options: TweakFolderOptions = {}
) {
  const renderer = useThree((s) => s.gl);
  const { open = true, order = 0 } = options;

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    return buildFolder(inspector, folder, defaults, schema, onChange, { open, order });
  }, [renderer, folder, defaults, schema, onChange, open, order]);
}

/** A dropdown pinned above the folders. `options` maps a display label to its value. */
export function useTweakSelect<T extends string>(
  label: string,
  options: Record<string, T>,
  value: T,
  onChange: (value: T) => void,
  order = -100
) {
  const renderer = useThree((s) => s.gl);
  const initial = useRef(value);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    return buildSelect(inspector, label, options, initial.current, onChange, order);
  }, [renderer, label, options, onChange, order]);
}

/** A button pinned below the folders. */
export function useTweakButton(label: string, onClick: () => void, order = 100) {
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    return buildButton(inspector, label, onClick, order);
  }, [renderer, label, onClick, order]);
}
