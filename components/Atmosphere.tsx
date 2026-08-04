import { useRef } from 'react';
import type { Color, FogExp2 } from 'three/webgpu';
import { FOG } from '@/configs/fogConfig';
import { useTweakEffect } from '@/hooks/useTweakEffect';

// Captured at import so a re-render could never hand `<fogExp2>` different args and get
// a new instance — replacing `scene.fog` rebuilds the fog node and recompiles every
// material. Lights have no such hazard, so they are left to the effect below.
const FOG_ARGS: [string, number] = [FOG.color, FOG.density];

export default function Atmosphere() {
  const fog = useRef<FogExp2>(null!);
  const background = useRef<Color>(null!);

  useTweakEffect(
    (s) => s.fog,
    ({ color, density }) => {
      fog.current.color.set(color);
      fog.current.density = density;
      background.current.set(color);
    }
  );

  return (
    <>
      <color ref={background} attach="background" args={[FOG.color]} />
      <fogExp2 ref={fog} attach="fog" args={FOG_ARGS} />
    </>
  );
}
