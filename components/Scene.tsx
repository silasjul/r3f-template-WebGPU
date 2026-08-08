"use client";

import { Canvas } from "@react-three/fiber";
import Light from "@/components/Light";
import Cube from "@/components/Cube";
import Controls from "@/components/Controls";
import { createWebGPURenderer, useParametersToggle } from "tsl-inspector";

export default function Scene() {
  useParametersToggle();

  return (
    <Canvas
      camera={{ position: [0, 14, 34], fov: 45, near: 0.1, far: 2000 }}
      gl={createWebGPURenderer}
    >
      <Light />
      <Cube />
      <Controls />
    </Canvas>
  );
}
