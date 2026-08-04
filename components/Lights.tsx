import { useRef } from 'react';
import type { DirectionalLight, HemisphereLight } from 'three/webgpu';
import { useTweakEffect } from '@/hooks/useTweakEffect';

export default function Lights() {
  const sun = useRef<DirectionalLight>(null!);
  const sky = useRef<HemisphereLight>(null!);

  useTweakEffect(
    (s) => s.light,
    (light) => {
      sun.current.color.set(light.sunColor);
      sun.current.intensity = light.intensity;
      sun.current.position.y = light.height;

      sky.current.color.set(light.skyColor);
      sky.current.groundColor.set(light.groundColor);
      sky.current.intensity = light.ambient;
    }
  );

  return (
    <>
      <hemisphereLight ref={sky} />
      <directionalLight ref={sun} position-x={-60} position-z={-40} />
    </>
  );
}
