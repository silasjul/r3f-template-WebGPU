'use client';

import { Canvas } from '@react-three/fiber';
import { createWebGPURenderer } from '@/inspector/renderer';
import Light from '@/components/Light';
import Cube from '@/components/Cube';
import Controls from '@/components/Controls';

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 14, 34], fov: 45, near: 0.1, far: 2000 }}
      gl={(props) => createWebGPURenderer(props)}
    >
      <Light />
      <Cube />
      <Controls />
    </Canvas>
  );
}
