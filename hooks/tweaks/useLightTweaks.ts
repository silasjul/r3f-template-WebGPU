import { LIGHT } from '@/configs/lightConfig';
import { colorRow } from '@/lib/inspector';
import { useParameters } from '@/hooks/useParameters';
import { useTweakStore } from '@/stores/tweakStore';

export function useLightTweaks() {
  const sync = useTweakStore((s) => s.syncLight);

  useParameters('Light', (group) => {
    colorRow(group, LIGHT, 'color', sync);
    group.add(LIGHT, 'intensity', 0, 6, 0.1).onChange(sync);
    group.add(LIGHT, 'height', 0, 100, 1).onChange(sync);

    colorRow(group, LIGHT, 'upColor', sync).name('up color');
    colorRow(group, LIGHT, 'downColor', sync).name('down color');
    group.add(LIGHT, 'fill', 0, 3, 0.05).onChange(sync);
  });
}
