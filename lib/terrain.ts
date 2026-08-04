import { BufferAttribute, PlaneGeometry } from 'three/webgpu';
import { createNoise2D, fbm2D } from '@/lib/noise';
import type { TerrainShape } from '@/configs/terrainConfig';

export type HeightSampler = (x: number, z: number) => number;

/**
 * Ground height in world units. Runs on the CPU so grass placement, cursor
 * projection and fire spread all read the exact same surface the mesh uses.
 */
export function createHeightSampler(shape: TerrainShape): HeightSampler {
  const base = createNoise2D(shape.seed);
  const warpX = createNoise2D(shape.seed + 101);
  const warpZ = createNoise2D(shape.seed + 202);
  const frequency = 1 / Math.max(shape.scale, 0.001);

  return (x, z) => {
    const nx = x * frequency;
    const nz = z * frequency;
    const sx = shape.warp === 0 ? nx : nx + warpX(nx, nz) * shape.warp;
    const sz = shape.warp === 0 ? nz : nz + warpZ(nx, nz) * shape.warp;

    return fbm2D(base, sx, sz, shape.octaves, shape.lacunarity, shape.persistence) * shape.height;
  };
}

export function buildTerrainGeometry(size: number, segments: number, sample: HeightSampler) {
  const geometry = new PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    position.setY(i, sample(position.getX(i), position.getZ(i)));
  }
  position.needsUpdate = true;

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}
