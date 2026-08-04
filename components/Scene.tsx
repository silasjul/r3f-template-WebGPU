'use client';

import { Canvas } from '@react-three/fiber';
import { createWebGPURenderer } from '@/lib/webgpu';
import Tweaks from '@/components/Tweaks';
import Atmosphere from '@/components/Atmosphere';
import Lights from '@/components/Lights';
import ActiveScene from '@/components/ActiveScene';
import Controls from '@/components/Controls';

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 22, 85], fov: 45, near: 0.1, far: 2000 }}
      gl={(props) => createWebGPURenderer(props)}
    >
      <Tweaks />
      <Atmosphere />
      <Lights />
      <ActiveScene />
      <Controls />
    </Canvas>
  );
}
