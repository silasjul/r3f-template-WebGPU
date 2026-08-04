import { useTweakStore } from '@/stores/tweakStore';

export default function Lights() {
  const { sunColor, intensity, height, skyColor, groundColor, ambient } = useTweakStore(
    (s) => s.light
  );

  return (
    <>
      <hemisphereLight color={skyColor} groundColor={groundColor} intensity={ambient} />
      <directionalLight position={[-60, height, -40]} intensity={intensity} color={sunColor} />
    </>
  );
}
