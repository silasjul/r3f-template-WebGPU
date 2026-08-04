import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

/** Bound to the canvas rather than R3F's event container, which also holds the Inspector. */
export default function Controls() {
  const canvas = useThree((s) => s.gl.domElement);

  return (
    <OrbitControls
      makeDefault
      domElement={canvas}
      target={[0, 0, 0]}
    />
  );
}
