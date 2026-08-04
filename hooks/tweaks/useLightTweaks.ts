import { LIGHT } from '@/configs/lightConfig';
import { colorRow } from '@/lib/inspector';
import { useParameters } from '@/hooks/useParameters';
import { syncConfig } from '@/stores/tweakStore';

export function useLightTweaks() {
  useParameters('Light', (group) => {
    const sync = () => syncConfig('light');

    colorRow(group, LIGHT, 'sunColor', sync);
    colorRow(group, LIGHT, 'skyColor', sync);
    colorRow(group, LIGHT, 'groundColor', sync);
    group.add(LIGHT, 'intensity', 0, 6, 0.1).onChange(sync);
    group.add(LIGHT, 'height', 0, 100, 1).onChange(sync);
    group.add(LIGHT, 'ambient', 0, 3, 0.05).onChange(sync);
  });
}
