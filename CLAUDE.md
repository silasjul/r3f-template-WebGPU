@AGENTS.md

# Verifying a feature

When you finish building a feature, verify it with **only** these two checks if you feel necessary:

- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript type-check

Never run `npm run build` or start the dev server (`npm run dev` / `npm start`) to verify your work. Ask user to check for you.

# Animation & styling

- **Animation** — prefer GSAP. Reach for it before Framer Motion, CSS animations, or hand-rolled `useFrame` tweens (per-frame 3D logic in `useFrame` is still fine).
- **Styling** — prefer Tailwind utility classes. Avoid separate CSS files or inline `style` props unless a value genuinely can't be expressed with Tailwind.

# Comments

Write as few comments as possible. Only add one when the code genuinely can't be understood without it — never restate what the code already says. Prefer clear names over explanatory comments.

# Inspector tweaks

Tweaks live in the **Parameters** tab of three.js's built-in WebGPU Inspector (attached in `lib/webgpu.ts`, dev-only) — no Leva. Press **`h`** to hide the panel.

Flow: **`config → hook → store → consumer`**

- **`configs/<name>Config.ts`** — a `<Name>Config` type and the object, e.g. `CUBE`. Defaults on disk, live values at runtime.
- **`use<Name>Tweaks.ts`** — declares the folder. Every row edits the config, then calls `syncConfig('<name>')`.
- **`stores/tweakStore.ts`** — generated from `CONFIGS`; slices and their types follow from the config objects, so there is nothing to keep in sync by hand.
- **consumers** — read from the store, anywhere in the scene.
- **`components/Tweaks.tsx`** — calls the hooks for folders that outlive a scene swap.

`<Tweaks />` must be **inside** the Canvas — `useParameters` reaches the Inspector through `useThree((s) => s.gl).inspector`, which is unset in production, so every folder no-ops there.

## Declaring is uniform. Reading decides renders.

Every row looks the same, so there is nothing to decide when you add one:

```ts
group.add(FOG, 'density', 0, 0.06, 0.0005).onChange(sync);
```

**What varies is how a component reads it**, because that is what decides whether React runs:

```tsx
// re-renders — use when the value changes the React tree
const shape = useTweakStore((s) => s.terrainShape);   // geometry gets rebuilt

// does not re-render — use when the value only lands on a three.js object
useTweakEffect((s) => s.terrainLook, (look) => {
  flat.set(look.color);
  material.current.wireframe = look.wireframe;
});
```

`useTweakEffect` subscribes to the store *outside* React, in a layout effect — `apply` runs on mount and on every change to that slice, and nothing renders. The next frame simply draws differently.

The Inspector never renders anything by itself: `group.add(obj, 'key')` attaches a DOM input whose listener does `obj.key = value` and stops. Leva is the opposite — `useControls` returns values, so it *must* re-render.

### Which to use

`useTweakStore` only when the value changes the React tree: geometry that is rebuilt, anything feeding a `useMemo`, conditional rendering. Today that is `cube.size`, `terrainShape` and `sceneId`.

`useTweakEffect` for everything else — materials, colours, uniforms, light properties, transforms.

For values read every frame, skip both and read `useTweakStore.getState()` inside `useFrame` (`cube.spin`).

Select narrowly when you subscribe: `(s) => s.cube.size` re-renders only when the size changes, while `(s) => s.cube` would re-render on a colour drag too.

### Slices

One config per folder, except where a folder mixes cheap values with something expensive — `TERRAIN_SHAPE` and `TERRAIN_LOOK` are separate so recolouring can never re-key the geometry `useMemo`.

## Saving

Tune, hit `log configs`, right-click the logged object → *Copy object*, paste back into `configs/`. It dumps `CONFIGS`, and clones because devtools reads a logged object lazily.

In production `build` never runs, nothing writes to a config, and the store keeps its initial copy.

## Skip all of this for a throwaway scene

The config/store layer exists so tweaks can be **saved** and **read from any component**. A one-off demo needs neither, and a row can bind straight to the object:

```ts
useParameters('Cube', (group) => {
  group.addColor(material.current, 'color');   // done. mutates the live Color.
  group.add(material.current, 'wireframe');
});
```

No config file, no store slice, no `sync`, nothing re-renders. Reach for the full flow when a value has to survive a paste-back or be read somewhere else — not by default.

## Rules

- **Colours go through `colorRow(group, CONFIG, 'key', sync)`.** A colour row hands back a packed int no matter what you passed in; `colorRow` normalises to `'#rrggbb'` in the config first, which is what keeps a dump paste-ready.
- **Construct once, then mutate.** `FOG_ARGS` is captured at import: if a re-render handed `<fogExp2>` different `args`, R3F would build a new instance, and replacing `scene.fog` rebuilds the fog node and recompiles every material. Lights carry no such hazard, so they are constructed bare and left to `useTweakEffect`.
- **`build` runs once**, on mount, so no `useCallback` is needed. Pass the third argument, `key`, to rebuild a folder against a different object (e.g. a newly selected mesh). `useTweakEffect` follows the same convention.
- **Prefer a disabling value to unmounting.** Fog has no `enabled` row because dragging density to 0 does it.
- **Keep `SceneId` a type-only import** in the store. A value import closes a real require cycle: store → registry → scenes → tweak hooks → store.
- Never pass a ref *into* a hook you write through — `react-hooks/immutability` treats a hook argument as a hook input and rejects it. Components own their refs and mutate them inside `useTweakEffect`.

## What the addon gives you

`add(object, property, ...)` picks the control from `typeof object[property]`:

- `number` + `(min, max, step)` → slider; `number` alone → drag-input
- `boolean` → checkbox, `string` → text, `function` → button
- third arg as an object → dropdown, `['a','b']` or `{ Label: value }`
- `addColor(object, property)` → colour picker
- `addFolder(name)` → nested group, `.close()` collapses it
- `.name('nicer label')` renames a row

It has no ordering or removal API — `List` only appends and `Parameters` never drops a group — so `lib/inspector.ts` stamps an order on each root row and re-sorts on every build, which keeps the button below the folders however a swap rebuilds them. Two traps in the addon itself:

- **`.listen()` never stops.** It rAF-polls the object to keep the row in sync, with no cancellation — safe on a folder that never unmounts, a leak on one that does.
- **`addColor` mis-renders dark swatches.** `_getColorHex` builds the hex without `padStart`, so a colour below `0x100000` shows an invalid swatch. The stored value is still correct.

`@types/three` types the API well but omits `ParametersGroup.close()`, `Item.parent`, `Item.userData` and `Inspector.parameters`, and types `renderer.inspector` as `InspectorBase` (which has no `createParameters`, so `getInspector` tests for the method). `lib/inspector.ts` holds every cast that results; don't spread them further.

# Structure

One component per file, named after the file. A scene owns a folder under `components/scenes/<name>/` holding **everything** for that scene — its components and its tweak hook.

```
components/     Scene · Tweaks · Atmosphere · Lights · ActiveScene · Controls
  scenes/       registry.ts
    terrain/    TerrainScene.tsx · useTerrainTweaks.ts
    cube/       CubeScene.tsx · useCubeTweaks.ts
configs/        one file per domain
hooks/          useParameters.ts · useTweakEffect.ts
  tweaks/       folders belonging to no single scene
lib/            inspector · noise · terrain · webgpu
stores/         tweakStore.ts
```

Shader authoring belongs in `lib/`, not in a component — `createTerrainShading` sits next to the geometry code it colours.

`components/scenes/registry.ts` maps a `SceneId` to a label and a component. `<ActiveScene />` renders whichever one `useTweakStore((s) => s.sceneId)` names, and `useSceneTweaks` switches it — the one folder with no config behind it, because which scene is open is session state, not a saved look. Scenes are imported eagerly; at ten of them, switch to `React.lazy` and give `<ActiveScene />` a Suspense boundary.

A scene calls its own tweak hook so the folder mounts and unmounts with it; global folders are called from `<Tweaks />`. Each hook is called exactly once — calling it twice would build the folder twice.

## Add a scene

1. `components/scenes/<name>/` — `<Name>Scene.tsx` plus `use<Name>Tweaks.ts`.
2. `configs/<name>Config.ts`, and one line in `CONFIGS`.
3. `components/scenes/registry.ts` — add the entry; `SceneId` and the dropdown pick it up.

## Add a folder (e.g. "sphere")

1. `configs/sphereConfig.ts` — `SphereConfig` and `export const SPHERE: SphereConfig = { ... }`.
2. `stores/tweakStore.ts` — add `sphere: SPHERE` to `CONFIGS`. That is the whole store change.
3. `use<Name>Tweaks.ts` — one row per knob, all `.onChange(sync)` where `sync = () => syncConfig('sphere')`.
4. Call it once, then consume with `useTweakEffect` unless the value rebuilds something.
