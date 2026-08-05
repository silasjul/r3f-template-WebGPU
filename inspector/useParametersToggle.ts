import { useEffect } from 'react';
import { getParametersTab, onInspector } from './addon';

type Options = {
  /** Key that collapses and reopens the panel. */
  shortcut?: string;
  /** Building a folder always forces the panel open, so `false` collapses it once. */
  open?: boolean;
};

/**
 * Collapses and reopens the Parameters panel, exactly as clicking its toolbar icon does — because
 * it clicks it. Reusing the addon's own handler keeps the button in place and the open/closed
 * state in one authority.
 *
 * Call this *after* the folder hooks: `onInspector` fires its listeners in subscription order, so
 * hook call order is what decides whether the folders exist by the time `open` is applied.
 */
export function useParametersToggle({ shortcut = 'h', open = false }: Options = {}) {
  useEffect(() => {
    let stopKeys: (() => void) | undefined;

    const stop = onInspector((inspector) => {
      stopKeys?.();

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
      stopKeys = () => window.removeEventListener('keydown', onKeyDown);
    });

    return () => {
      stop();
      stopKeys?.();
    };
  }, [shortcut, open]);
}
