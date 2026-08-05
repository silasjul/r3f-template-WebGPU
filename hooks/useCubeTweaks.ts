import { useEffect } from 'react';
import { useControls } from '@/inspector/useControls';
import { CUBE_DEFAULTS } from '@/configs/cubeConfig';
import { useTweakStore } from '@/stores/tweakStore';

export function useCubeTweaks() {
  const setConfig = useTweakStore((s) => s.setCube);

  const { color, size, spin, wireframe } = useControls('Cube', {
    color: CUBE_DEFAULTS.color,
    size: { value: CUBE_DEFAULTS.size, min: 1, max: 40, step: 0.5 },
    spin: { value: CUBE_DEFAULTS.spin, min: 0, max: 3, step: 0.05 },
    wireframe: CUBE_DEFAULTS.wireframe,
  });

  useEffect(() => {
    setConfig({ color, size, spin, wireframe });
  }, [setConfig, color, size, spin, wireframe]);
}
