import { TERRAIN_LOOK, TERRAIN_SHAPE } from '@/configs/terrainConfig';
import { colorRow } from '@/lib/inspector';
import { useParameters } from '@/hooks/useParameters';
import { syncConfig } from '@/stores/tweakStore';

/** Two configs, because the shape rebuilds the geometry and the look never should. */
export function useTerrainTweaks() {
  useParameters('Terrain', (group) => {
    const syncShape = () => syncConfig('terrainShape');
    const syncLook = () => syncConfig('terrainLook');

    group.add(TERRAIN_SHAPE, 'seed', 0, 9999, 1).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'scale', 5, 300, 1).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'height', 0, 40, 0.1).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'octaves', 1, 8, 1).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'lacunarity', 1, 4, 0.05).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'persistence', 0, 1, 0.01).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'warp', 0, 2, 0.01).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'size', 20, 600, 10).onChange(syncShape);
    group.add(TERRAIN_SHAPE, 'segments', 16, 400, 8).onChange(syncShape);

    colorRow(group, TERRAIN_LOOK, 'color', syncLook);
    colorRow(group, TERRAIN_LOOK, 'slopeColor', syncLook).name('slope color');
    group.add(TERRAIN_LOOK, 'wireframe').onChange(syncLook);
  });
}
