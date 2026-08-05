import { useEffect } from 'react';
import { useControls } from '@/inspector/useControls';
import { LIGHT_DEFAULTS } from '@/configs/lightConfig';
import { useTweakStore } from '@/stores/tweakStore';

export function useLightTweaks() {
  const setConfig = useTweakStore((s) => s.setLight);

  const { color, intensity, height, upColor, downColor, fill } = useControls('Light', {
    color: LIGHT_DEFAULTS.color,
    intensity: { value: LIGHT_DEFAULTS.intensity, min: 0, max: 6, step: 0.1 },
    height: { value: LIGHT_DEFAULTS.height, min: 0, max: 100, step: 1 },
    upColor: { value: LIGHT_DEFAULTS.upColor, label: 'up color' },
    downColor: { value: LIGHT_DEFAULTS.downColor, label: 'down color' },
    fill: { value: LIGHT_DEFAULTS.fill, min: 0, max: 3, step: 0.05 },
  });

  useEffect(() => {
    setConfig({ color, intensity, height, upColor, downColor, fill });
  }, [setConfig, color, intensity, height, upColor, downColor, fill]);
}
