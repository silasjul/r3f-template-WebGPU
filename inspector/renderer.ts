import * as THREE from 'three/webgpu';
import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import { setInspector } from './addon';

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as unknown as Parameters<typeof extend>[0]);

type GLDefaults = {
  canvas: unknown;
  antialias?: boolean;
  alpha?: boolean;
};

/** Falls back to WebGL2 on its own when the browser has no WebGPU adapter. */
export async function createWebGPURenderer(props: GLDefaults) {
  const renderer = new THREE.WebGPURenderer({
    canvas: props.canvas as HTMLCanvasElement,
    antialias: props.antialias ?? true,
    alpha: props.alpha,
  });

  // Must be assigned before init(): the renderer only mounts the inspector's DOM
  // from inside its own init(), and that promise is memoised.
  if (process.env.NODE_ENV === 'development') {
    const { Inspector } = await import('three/addons/inspector/Inspector.js');
    const inspector = new Inspector();

    // The panel mounts as a sibling of the canvas inside R3F's event container, so
    // without this every drag inside it also reaches the scene. The panel's own
    // drag handlers sit on inner elements and still run first.
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'contextmenu']) {
      inspector.domElement.addEventListener(type, (e) => e.stopPropagation());
    }

    renderer.inspector = inspector;
    setInspector(inspector);
  }

  await renderer.init();

  return renderer;
}
