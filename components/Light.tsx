import { useTweakStore } from '@/stores/tweakStore';

export default function Light() {
  const { color, intensity, height, upColor, downColor, fill } = useTweakStore((s) => s.light);

  return (
    <>
      <hemisphereLight color={upColor} groundColor={downColor} intensity={fill} />
      <directionalLight position={[-60, height, -40]} intensity={intensity} color={color} />
    </>
  );
}
