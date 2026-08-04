'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { createWebGPURenderer } from '@/lib/webgpu';
import Tweaks from '@/components/Tweaks';
import { SCENES } from '@/components/scenes/registry';
import { FOG_DEFAULTS } from '@/configs/fogConfig';
import { useTweakStore } from '@/stores/tweakStore';

// Constructed once with a fixed arg so live tweaks mutate the fog instead of replacing it,
// which would rebuild the fog node and recompile every material.
const FOG_ARGS: [string] = [FOG_DEFAULTS.color];

function Atmosphere() {
  const { enabled, color, density } = useTweakStore((s) => s.fog);

  return (
    <>
      <color attach="background" args={[color]} />
      {enabled && <fogExp2 attach="fog" args={FOG_ARGS} color={color} density={density} />}
    </>
  );
}

/** Swapping this unmounts the old scene's tweak folders and builds the new one's. */
function ActiveScene() {
  const sceneId = useTweakStore((s) => s.sceneId);
  const { Component } = SCENES[sceneId];

  return <Component />;
}

/** Bound to the canvas rather than R3F's event container, which also holds the Inspector. */
function Controls() {
  const canvas = useThree((s) => s.gl.domElement);

  return (
    <OrbitControls
      makeDefault
      domElement={canvas}
      target={[0, 0, 0]}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 22, 85], fov: 45, near: 0.1, far: 2000 }}
      gl={(props) => createWebGPURenderer(props)}
    >
      <Tweaks />
      <Atmosphere />
      <hemisphereLight args={['#cdd8ff', '#6b5a3a', 0.6]} />
      <directionalLight position={[-60, 24, -40]} intensity={2.4} color="#ffd9a0" />
      <ActiveScene />
      <Controls />
    </Canvas>
  );
}
