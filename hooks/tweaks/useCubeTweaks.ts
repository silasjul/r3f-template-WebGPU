import { CUBE } from '@/configs/cubeConfig';
import { colorRow } from '@/lib/inspector';
import { useParameters } from '@/hooks/useParameters';
import { useTweakStore } from '@/stores/tweakStore';

export function useCubeTweaks() {
  const sync = useTweakStore((s) => s.syncCube);

  useParameters('Cube', (group) => {
    colorRow(group, CUBE, 'color', sync);
    group.add(CUBE, 'size', 1, 40, 0.5).onChange(sync);
    group.add(CUBE, 'spin', 0, 3, 0.05).onChange(sync);
    group.add(CUBE, 'wireframe').onChange(sync);
  });
}
