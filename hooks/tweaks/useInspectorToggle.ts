import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { getInspector } from '@/lib/inspector';

/** Hides the whole panel, the way `h` did in the Leva setup. */
export function useInspectorToggle(shortcut = 'h') {
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const inspector = getInspector(renderer);
    if (!inspector) return;

    let hidden = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== shortcut) return;

      const target = e.target as HTMLElement;
      if (target.isContentEditable) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      hidden = !hidden;
      if (hidden) inspector.hide();
      else inspector.show();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [renderer, shortcut]);
}
