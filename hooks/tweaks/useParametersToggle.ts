import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { getInspector, getParametersTab } from '@/lib/inspector';

type Options = {
  /** Key that collapses and reopens the panel. */
  shortcut?: string;
  /** Building a folder always forces the panel open, so `false` collapses it once. */
  open?: boolean;
};

/**
 * Collapses and reopens the Parameters panel, exactly as clicking its toolbar icon
 * does — because it clicks it. Reusing the addon's own handler keeps the button in
 * place and the open/closed state in one authority.
 *
 * Call this *after* the folder hooks, so the panel exists by the time `open` is applied.
 */
export function useParametersToggle({ shortcut = 'h', open = false }: Options = {}) {
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    const button = getParametersTab(inspector).builtinButton;

    // `active` is the addon's own open marker, so this sets the state rather than
    // blindly toggling it.
    if (button && button.classList.contains('active') !== open) button.click();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== shortcut) return;

      const target = e.target as HTMLElement;
      if (target.isContentEditable) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      button?.click();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [renderer, shortcut, open]);
}
