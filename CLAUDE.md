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

# Structure

One component per file, named after the file. `Cube` is the worked example: declare the folder, read the values, render.

```
components/     Scene · InspectorControls · Light · Cube · Controls
configs/        one plain object per domain
hooks/          useParameters.ts
  tweaks/       one hook per folder
lib/            inspector · webgpu
stores/         tweakStore.ts
```

Geometry and shader authoring belongs in `lib/`, not in a component.

# Inspector tweaks

Tweaks live in the **Parameters** tab of three.js's built-in WebGPU Inspector (attached in `lib/webgpu.ts`, dev-only) — no Leva. Press **`h`** to collapse and reopen that panel, the same as clicking its toolbar icon. It starts collapsed; `useParametersToggle({ open: true })` in `InspectorControls` starts it open.

Flow: **`config → hook → store → consumer`**

- **`configs/<name>Config.ts`** — a `<Name>Config` type and the object, e.g. `CUBE`. Defaults on disk, live values at runtime.
- **`hooks/tweaks/use<Name>Tweaks.ts`** — declares the folder. Every row edits the config, then calls that folder's `sync`.
- **`stores/tweakStore.ts`** — one slice + one `sync<Name>` per config. Two lines each, no generics.
- **consumers** — `useTweakStore((s) => s.cube)`, from any component.
- **`components/InspectorControls.tsx`** — calls every tweak hook, plus the hide key and save button. The one place folders are registered; consumers never come here.

`<InspectorControls />` must be **inside** the Canvas, since `useParameters` reaches the Inspector through `useThree((s) => s.gl).inspector`. That is unset in production, so every folder no-ops there. Call each hook exactly once — twice would build the folder twice.

If a folder ever has to mount and unmount with something (a swappable scene, a selected object), call its hook from that component instead; the folder's lifetime follows the caller.

## One path

Every row syncs, every consumer subscribes. There is no second channel and no decision to make:

```ts
group.add(CUBE, 'size', 1, 40, 0.5).onChange(sync);
```

```tsx
const { color, size, spin, wireframe } = useTweakStore((s) => s.cube);
```

Dragging a slider re-renders the components reading that slice, and R3F re-applies the props. That is cheap — a re-render doesn't redraw the canvas (the render loop does that every frame regardless), it just re-applies props to objects that already exist. This is a dev-only panel; do not optimise it.

The Inspector itself never renders anything: `group.add(obj, 'key')` attaches a DOM input whose listener does `obj.key = value` and stops. `.onChange(sync)` is what carries it into React.

## The one thing to watch: `args` vs props

A prop sets a value on an object that already exists — `color`, `intensity`, `position`, `wireframe`. Cheap, no matter how often it changes.

`args` are **constructor** arguments. R3F shallow-compares them and, if they differ, disposes the object and builds a new one. `<boxGeometry args={[size, size, size]} />` genuinely rebuilds the geometry when `size` changes — which is correct, because a geometry can't be resized in place.

So the only real cost to think about is when a render **reconstructs** something:

- keep expensive `useMemo`s keyed on just the fields that affect them, not a whole slice
- if a folder mixes cheap values with something expensive, split the config so the cheap rows can't invalidate it
- if you add fog, construct it with fixed `args` and mutate it — replacing `scene.fog` rebuilds the fog node and recompiles every material. Prefer `density = 0` to unmounting it.

For a value read every frame, you can skip the subscription with `useTweakStore.getState()` inside `useFrame` — but only bother if the component is genuinely expensive.

## Saving

Tune, hit `log configs`, right-click the logged object → *Copy object*, paste back into `configs/`. It dumps the store — every slice, minus the `sync` functions. Each sync replaces its slice with a fresh object, so a logged snapshot never changes under you.

In production `build` never runs, nothing writes to a config, and the store keeps its initial copy.

## Skip all of this for a throwaway scene

The config/store layer buys **saving** and **reading a tweak from any component**. A one-off demo needs neither, and a row can bind straight to the object:

```ts
useParameters('Cube', (group) => {
  group.addColor(material.current, 'color');   // done. mutates the live Color.
  group.add(material.current, 'wireframe');
});
```

No config file, no store slice, no `sync`, nothing re-renders. Reach for the full flow when a value has to survive a paste-back or be read somewhere else — not by default.

## Rules

- **Colours go through `colorRow(group, CONFIG, 'key', sync)`** — the one row that isn't plain `group.add`. A colour editor reports a packed int whatever you passed in, so `colorRow` normalises to `'#rrggbb'` in the config first, which is what keeps a dump pasteable.
- **`build` runs once**, on mount, so no `useCallback` is needed. If a folder ever has to rebind to a different object, give `useParameters` a dependency then — not before.
- Never pass a ref *into* a hook you write through — `react-hooks/immutability` treats a hook argument as a hook input and rejects it.

## What the addon gives you

`add(object, property, ...)` picks the control from `typeof object[property]`:

- `number` + `(min, max, step)` → slider; `number` alone → drag-input
- `boolean` → checkbox, `string` → text, `function` → button
- third arg as an object → dropdown, `['a','b']` or `{ Label: value }`
- `addColor(object, property)` → colour picker
- `addFolder(name)` → nested group, `.close()` collapses it
- `.name('nicer label')` renames a row

It has no ordering or removal API — `List` only appends and `Parameters` never drops a group — so `lib/inspector.ts` stamps an order on each root row and re-sorts on every build, which keeps the button below the folders however they are rebuilt. Two traps in the addon itself:

- **`.listen()` never stops.** It rAF-polls the object to keep the row in sync, with no cancellation — safe on a folder that never unmounts, a leak on one that does.
- **`addColor` mis-renders dark swatches.** `_getColorHex` builds the hex without `padStart`, so a colour below `0x100000` shows an invalid swatch. The stored value is still correct.
- **Building a folder forces the panel open.** `createParameters` calls `parameters.show()` whenever the tab is hidden, and that ends in `showBuiltin()`, which opens the mini-panel. Unlike the main panel's layout it is not persisted, so the only way to start collapsed is to close it after the folders are built — which is what `useParametersToggle`'s `open` option does, and why it is called last.
- **There are three different "hides", and two are traps.** `Inspector.show()` throws — it forwards to `Profiler.show(tab)` without a tab. `Tab.hide()` works but also hides the tab's toolbar icon, so there is nothing left to click. To collapse a panel the way its icon does, click the icon: `getParametersTab(inspector).builtinButton?.click()`. Toggling `inspector.domElement` hides the whole overlay instead.

`@types/three` types the API well but omits `ParametersGroup.close()`, `Item.parent`, `Item.userData` and `Inspector.parameters`, and types `renderer.inspector` as `InspectorBase` (which has no `createParameters`, so `getInspector` tests for the method). `lib/inspector.ts` holds every cast that results; don't spread them further.

## Add a folder (e.g. "sphere")

1. `configs/sphereConfig.ts` — `SphereConfig` and `export const SPHERE: SphereConfig = { ... }`.
2. `stores/tweakStore.ts` — add `sphere: { ...SPHERE }` and `syncSphere`, two lines.
3. `hooks/tweaks/useSphereTweaks.ts` — `const sync = useTweakStore((s) => s.syncSphere)`, then one row per knob, all `.onChange(sync)`.
4. `components/InspectorControls.tsx` — call it.
5. Read it anywhere with `useTweakStore((s) => s.sphere)`.
