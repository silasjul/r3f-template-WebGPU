import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "tsl-inspector";
import type { Mesh } from "three/webgpu";
import { CUBE_DEFAULTS } from "@/configs/cubeScene";
import { cubeColorNode } from "@/lib/shaders/cubePattern";

export default function Cube() {
  const mesh = useRef<Mesh>(null!);
  const { size, spin, wireframe } = useControls(
    "Cube/Shape",
    {
      size: { value: CUBE_DEFAULTS.size, min: 1, max: 40, step: 0.5 },
      spin: { value: CUBE_DEFAULTS.spin, min: 0, max: 3, step: 0.05 },
      wireframe: CUBE_DEFAULTS.wireframe,
    },
    { order: 1 },
  );

  useFrame((_, delta) => {
    mesh.current.rotation.y += delta * spin;
  });

  return (
    <mesh ref={mesh} scale={size}>
      <boxGeometry />
      <meshStandardNodeMaterial
        colorNode={cubeColorNode}
        wireframe={wireframe}
        roughness={0.6}
      />
    </mesh>
  );
}
