import { FOG_DEFAULTS, type FogConfig } from '@/configs/fogConfig';
import { useTweakStore } from '@/stores/tweakStore';
import { useTweaks, type TweakSchema } from '@/hooks/inspector/useTweaks';

const SCHEMA: TweakSchema<FogConfig> = {
  color: { color: true },
  density: { min: 0, max: 0.06, step: 0.0005 },
};

export function useFogTweaks() {
  const setFog = useTweakStore((s) => s.setFog);

  useTweaks('Fog', FOG_DEFAULTS, SCHEMA, setFog);
}
