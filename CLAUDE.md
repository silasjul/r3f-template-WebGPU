@AGENTS.md

# Verifying a feature

When you finish building a feature, verify it with **only** these two checks if you feel necessary:

- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript type-check

Never run `npm run build` or start the dev server (`npm run dev` / `npm start`) to verify your work. Ask user to check for you.

# How I like things done

Read this before proposing an approach. These are settled preferences, not suggestions.

- **Explicit beats clever.** Two obvious lines beat one generic line. The store writes a slice and a `sync` per config by hand; a version generated from a registry was tried and thrown out, because it cost a `Pick<>` cast, a `structuredClone` footgun and a paragraph of comment to save one line per domain.
- **Readable repetition beats invisible magic.** `.onChange(sync)` on every row is boring to type and impossible to misread. Wiring it automatically would move *why a value reaches React* into a file nobody opens. Don't.
- **Don't optimise a dev tool.** The panel is dev-only. A re-render while dragging a slider re-applies props to objects that already exist — it doesn't redraw the canvas, that happens every frame regardless. Route everything through the store and stop thinking about it.
- **Names say what a thing is, not what it's like.** No `sun`, no `sky`. A hemisphere light's colours are `upColor`/`downColor` because that's what they do. A component called `Tweaks` that declares no tweaks gets renamed.
- **No barrel files.** No `index.ts` that only re-exports. Import from the real path.
- **Co-locate.** Everything for one concept in one place. Never split a thing across two directory trees.
- **One component per file**, named after the file. Splitting `Scene.tsx` into `Light`, `Cube`, `Controls` and `InspectorControls` is the shape to keep.
- **Delete unused API.** No "might need it later" parameters. Add them back the day they're needed.
- **Verify against source, don't guess.** The Inspector is new enough that training data is unreliable. Read `node_modules/three/examples/jsm/inspector/` before claiming what an API does.

# Animation & styling

- **Animation** — prefer GSAP. Reach for it before Framer Motion, CSS animations, or hand-rolled `useFrame` tweens (per-frame 3D logic in `useFrame` is still fine).
- **Styling** — prefer Tailwind utility classes. Avoid separate CSS files or inline `style` props unless a value genuinely can't be expressed with Tailwind.

# Comments

Write as few comments as possible. Only add one when the code genuinely can't be understood without it — never restate what the code already says. Prefer clear names over explanatory comments.

Worth a comment: a workaround for someone else's bug, a non-obvious ordering constraint, a line that looks simplifiable but isn't.

# Structure

```
app/            Next routes
components/     Scene · InspectorControls · Light · Cube · Controls
configs/        one plain object per domain
hooks/          useParameters.ts
  tweaks/       one hook per folder
lib/            inspector · webgpu — no React in here
stores/         tweakStore.ts
```

- `lib/` is framework-free: DOM, three.js, maths. Geometry and shader authoring belongs here, never in a component.
- `hooks/tweaks/` is one file per panel folder, nothing else.
- A component reads what it needs from the store and renders. It should be short enough to take in at a glance.

# Inspector tweaks

Tweaks live in the **Parameters** tab of three.js's built-in WebGPU Inspector (attached in `lib/webgpu.ts`, dev-only) — no Leva. Press **`h`** to collapse and reopen the panel, the same as clicking its toolbar icon. It starts collapsed; `useParametersToggle({ open: true })` starts it open.

Flow: **`config → hook → store → consumer`**

| File | Job |
|---|---|
| `configs/<name>Config.ts` | a `<Name>Config` type and the object, e.g. `CUBE`. Defaults on disk, live values at runtime. |
| `hooks/tweaks/use<Name>Tweaks.ts` | declares one folder. Every row edits the config, then calls that folder's `sync`. |
| `stores/tweakStore.ts` | one slice + one `sync<Name>` per config. Two lines each. |
| `components/InspectorControls.tsx` | calls every tweak hook. The single registration point. |
| anywhere | `useTweakStore((s) => s.cube)` |

## One path, no decisions

Every row looks the same:

```ts
group.add(CUBE, 'size', 1, 40, 0.5).onChange(sync);
```

Every consumer looks the same:

```tsx
const { color, size, spin, wireframe } = useTweakStore((s) => s.cube);
```

The Inspector is plain DOM with no knowledge of React: `group.add(obj, 'key')` attaches an input whose listener does `obj.key = value` and stops. `.onChange(sync)` is the only thing that carries a change into React. Leva was the opposite — `useControls` returns values, so it *had* to re-render, which is why the old template mounted it outside the Canvas. That precaution is obsolete here.

`<InspectorControls />` must be **inside** the Canvas — `useParameters` reaches the Inspector through `useThree((s) => s.gl).inspector`, which is unset in production, so every folder no-ops there. Call each hook exactly once; twice builds the folder twice.

If a folder must mount and unmount with something (a swappable scene, a selected object), call its hook from that component instead — a folder's lifetime follows its caller.

## The one real cost: `args` vs props

A prop sets a value on an object that already exists — `color`, `intensity`, `position`. Cheap however often it changes.

`args` are **constructor** arguments. R3F shallow-compares them and, if they differ, disposes the object and builds a new one. `<boxGeometry args={[size, size, size]} />` genuinely rebuilds the geometry when `size` changes, because a geometry can't be resized in place.

So the only thing to think about is when a render **reconstructs** something:

- key expensive `useMemo`s on just the fields that affect them, not a whole slice
- if a folder mixes cheap values with something expensive, split it into two configs so the cheap rows can't invalidate the expensive memo
- if you add fog, construct it with fixed `args` and mutate it — replacing `scene.fog` rebuilds the fog node and recompiles every material. Prefer `density = 0` to unmounting it.

For something read every frame, `useTweakStore.getState()` inside `useFrame` skips the subscription — but only bother if the component is genuinely expensive.

## Saving

Tune, hit `log configs`, right-click the logged object → *Copy object*, paste back into `configs/`. It dumps the store minus its `sync` functions. Each sync replaces its slice with a fresh object, so a logged snapshot never changes under you.

In production `build` never runs, nothing writes to a config, and the store keeps its initial copy.

## Add a folder (e.g. "sphere")

1. `configs/sphereConfig.ts` — `SphereConfig` and `export const SPHERE: SphereConfig = { ... }`.
2. `stores/tweakStore.ts` — add `sphere: { ...SPHERE }` and `syncSphere`, two lines.
3. `hooks/tweaks/useSphereTweaks.ts` — `const sync = useTweakStore((s) => s.syncSphere)`, then one row per knob, all `.onChange(sync)`.
4. `components/InspectorControls.tsx` — call it.
5. Read it anywhere with `useTweakStore((s) => s.sphere)`.

## Throwaway scenes

The config/store layer buys **saving** and **reading a tweak from any component**. A one-off demo needs neither, and a row can bind straight to the object:

```ts
useParameters('Cube', (group) => {
  group.addColor(material.current, 'color');   // done. mutates the live Color.
  group.add(material.current, 'wireframe');
});
```

No config, no slice, no `sync`, nothing re-renders. Reach for the full flow when a value has to survive a paste-back or be read elsewhere — not by default.

# The addon

`add(object, property, ...)` picks the control from `typeof object[property]`:

- `number` + `(min, max, step)` → slider; `number` alone → drag-input
- `boolean` → checkbox, `string` → text, `function` → button
- third arg as an object → dropdown, `['a','b']` or `{ Label: value }`
- `addColor(object, property)` → colour picker
- `addFolder(name)` → nested group, `.close()` collapses it
- `.name('nicer label')` renames a row

**`colorRow` is the one row that isn't plain `group.add`.** A colour editor reports a packed int whatever you passed in, so it normalises to `'#rrggbb'` in the config first — which is what keeps a dump pasteable.

The tab has no ordering or removal API: `List` only appends and `Parameters` never drops a group. `lib/inspector.ts` stamps an order on each root row and re-sorts on every build, which is what keeps the save button below the folders.

## Traps, all verified against source

- **`.listen()` never stops.** It rAF-polls the object to keep a row in sync, with no cancellation — safe on a folder that never unmounts, a leak on one that does.
- **`addColor` mis-renders dark swatches.** `_getColorHex` builds the hex without `padStart`, so a colour below `0x100000` shows an invalid swatch. The stored value is still correct.
- **Three different "hides", two of them traps.** `Inspector.show()` throws — it forwards to `Profiler.show(tab)` with no tab. `Tab.hide()` works but also hides the tab's toolbar icon, leaving nothing to click. To collapse a panel the way its icon does, click the icon: `getParametersTab(inspector).builtinButton?.click()`. Toggling `inspector.domElement` hides the entire overlay instead.
- **Building a folder forces the panel open.** `createParameters` calls `parameters.show()` whenever the tab is hidden. Unlike the main panel's layout it isn't persisted, so the only way to start collapsed is to close it after the folders exist — which is why `useParametersToggle` is called last.
- **The native colour picker's HEX/RGB mode is browser chrome.** Not settable from the page; Chrome remembers the last mode per profile.

`@types/three` types the API well but omits `ParametersGroup.close()`, `Item.parent`, `Item.userData` and `Inspector.parameters`, and types `renderer.inspector` as `InspectorBase` (which has no `createParameters`, so `getInspector` tests for the method). `lib/inspector.ts` holds every cast that results; don't spread them further.

# Rejected on purpose

Don't reintroduce these without a concrete reason — each was built, used, and removed.

- **`useTweakEffect`** (store subscription outside React, zero re-render). Real, and unnecessary: it optimised a cost that doesn't exist for a dev panel, and split every value into two channels you had to choose between.
- **Splitting configs by channel** (`CUBE` vs `CUBE_LIVE`). Same reason.
- **A generated store** (`CONFIGS` registry, `syncConfig<K>` with a cast). Saved one line per domain, cost readability.
- **Row files** (`cubeRows.ts` taking three.js objects). Direct mutation without refs, but it scattered the tweaks and made values unreadable elsewhere.
- **Auto-syncing rows** by walking `group.objects`. Would delete `.onChange(sync)` everywhere and hide the wiring.
- **A schema/defaults wrapper over the addon** (`TweakSchema`, folder builders). This is rebuilding Leva on top of an API that already binds to live objects.
