import { FOG } from '@/configs/fogConfig';
import { colorRow } from '@/lib/inspector';
import { useParameters } from '@/hooks/useParameters';
import { syncConfig } from '@/stores/tweakStore';

export function useFogTweaks() {
  useParameters('Fog', (group) => {
    const sync = () => syncConfig('fog');

    colorRow(group, FOG, 'color', sync);
    group.add(FOG, 'density', 0, 0.06, 0.0005).onChange(sync);
  });
}
