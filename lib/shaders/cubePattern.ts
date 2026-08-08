import { mix, sin, time, uv } from "three/tsl";
import { controls } from "tsl-inspector";
import { PATTERN_DEFAULTS } from "@/configs/cubeScene";

/**
 * `controls` is `useControls` with no React — every row comes back as a TSL uniform, so the panel
 * writes `node.value` and the next frame differs. No re-render, no recompile, no store.
 *
 * The path puts these rows inside the `Cube` folder that `Cube.tsx` builds, whichever runs first.
 */
const { colorA, colorB, scale, speed } = controls("Cube/Pattern", {
  colorA: PATTERN_DEFAULTS.colorA,
  colorB: PATTERN_DEFAULTS.colorB,
  scale: { value: PATTERN_DEFAULTS.scale, min: 1, max: 40, step: 0.5 },
  speed: { value: PATTERN_DEFAULTS.speed, min: 0, max: 5, step: 0.05 },
});

/** Diagonal stripes that scroll. `sin` gives -1..1, so it is remapped to the 0..1 `mix` wants. */
const stripes = sin(uv().x.add(uv().y).mul(scale).sub(time.mul(speed)))
  .mul(0.5)
  .add(0.5);

export const cubeColorNode = mix(colorA, colorB, stripes);
