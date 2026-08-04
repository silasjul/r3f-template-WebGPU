@AGENTS.md

# Verifying a feature

When you finish a feature, verify it with **only** these two checks, and only if it seems worthwhile:

- `npm run lint`
- `npx tsc --noEmit`

Never run `npm run build` or start the dev server. Ask the user to check for you.

# How I like things done

Settled preferences, not suggestions.

- **Explicit beats clever.** Two obvious lines beat one generic line. Readable repetition beats wiring you have to go find — `.onChange(sync)` on every row is boring to type and impossible to misread.
- **Names say what a thing is, not what it's like.** A hemisphere light's colours are `upColor`/`downColor`, not `sun`/`sky`.
- **One component per file**, named after the file.
- **No barrel files.** Import from the real path.
- **Co-locate.** Everything for one concept in one place, never split across two directory trees.
- **Delete unused API.** No "might need it later" parameters.
- **Don't optimise the dev panel.** A re-render while dragging a slider re-applies props to objects that already exist. Route everything through the store and stop thinking about it.
- **Verify against source, don't guess.** The Inspector is newer than your training data — read `node_modules/three/examples/jsm/inspector/` before claiming what its API does.

# Animation & styling

- **Animation** — prefer GSAP over Framer Motion, CSS animations, or hand-rolled `useFrame` tweens. Per-frame 3D logic in `useFrame` is still fine.
- **Styling** — Tailwind utilities. No separate CSS files or inline `style` props unless a value genuinely can't be expressed with Tailwind.

# Comments

Write as few as possible, and never restate what the code already says. Prefer clear names.

Worth a comment: a workaround for someone else's bug, a non-obvious ordering constraint, a line that looks simplifiable but isn't.

# Structure

```
app/            Next routes
components/     one component each
configs/        one plain object per domain
hooks/          useParameters.ts
  tweaks/       one hook per panel folder
lib/            inspector · webgpu — no React in here
stores/         tweakStore.ts
```

- `lib/` is framework-free: DOM, three.js, maths. Geometry and shader authoring belongs here, never in a component.
- A component reads what it needs from the store and renders, short enough to take in at a glance.

# Inspector tweaks

Tweaks live in the **Parameters** tab of three.js's built-in WebGPU Inspector (attached in `lib/webgpu.ts`, dev-only) — no Leva. Press **`h`** to collapse and reopen the panel.

Flow: **`config → hook → store → consumer`**. To add a folder, e.g. "sphere":

1. `configs/sphereConfig.ts` — a `SphereConfig` type and `export const SPHERE: SphereConfig = { ... }`. Defaults on disk, live values at runtime.
2. `stores/tweakStore.ts` — `sphere: { ...SPHERE }` and `syncSphere`, two lines.
3. `hooks/tweaks/useSphereTweaks.ts` — `const sync = useTweakStore((s) => s.syncSphere)`, then one row per knob:
   ```ts
   group.add(SPHERE, 'size', 1, 40, 0.5).onChange(sync);
   ```
4. `components/InspectorControls.tsx` — call the hook. The single registration point.
5. Read it anywhere: `const { size } = useTweakStore((s) => s.sphere)`.

The Inspector is plain DOM with no knowledge of React: `group.add(obj, 'key')` attaches an input whose listener does `obj.key = value` and stops. `.onChange(sync)` is the only thing that carries a change into React.

`<InspectorControls />` must be **inside** the Canvas — `useParameters` reaches the Inspector through `useThree((s) => s.gl).inspector`, which is unset in production, so every folder no-ops there. Call each hook exactly once; twice builds the folder twice. If a folder should mount and unmount with something (a swappable scene, a selected object), call its hook from that component instead — a folder's lifetime follows its caller.

## Throwaway scenes

The config/store layer buys **saving** and **reading a tweak from any component**. A one-off demo needs neither, and a row can bind straight to the object:

```ts
useParameters('Cube', (group) => {
  group.addColor(material.current, 'color');   // done. mutates the live Color.
  group.add(material.current, 'wireframe');
});
```

Reach for the full flow when a value has to survive a paste-back or be read elsewhere — not by default.

## Saving

Tune, hit `log configs`, right-click the logged object → *Copy object*, paste back into `configs/`. It dumps the store minus its `sync` functions. In production nothing writes to a config and the store keeps its initial copy.

## The one real cost: `args` vs props

A prop sets a value on an object that already exists — `color`, `intensity`, `position`. Cheap however often it changes.

`args` are **constructor** arguments. R3F shallow-compares them and rebuilds the object when they differ, so `<boxGeometry args={[size, size, size]} />` genuinely disposes and rebuilds the geometry on every `size` change.

So the only thing to think about is when a render **reconstructs** something:

- key expensive `useMemo`s on just the fields that affect them, not a whole slice
- if a folder mixes cheap values with something expensive, split it into two configs so the cheap rows can't invalidate the expensive memo
- for something read every frame, `useTweakStore.getState()` inside `useFrame` skips the subscription — but only bother if the component is genuinely expensive

# The addon

`add(object, property, ...)` picks the control from `typeof object[property]`:

- `number` + `(min, max, step)` → slider; `number` alone → drag-input
- `boolean` → checkbox, `string` → text, `function` → button
- third arg as an object → dropdown, `['a','b']` or `{ Label: value }`
- `addColor(object, property)` → colour picker
- `addFolder(name)` → nested group, `.close()` collapses it
- `.name('nicer label')` renames a row

Colours go through `colorRow` instead of `group.add` — a colour editor reports a packed int whatever you passed in, and `colorRow` normalises it back to `'#rrggbb'` so a dump stays pasteable.

## Traps, verified against source

- **`.listen()` never stops.** It rAF-polls the object with no cancellation — safe on a folder that never unmounts, a leak on one that does.
- **`addColor` mis-renders dark swatches.** `_getColorHex` skips `padStart`, so a colour below `0x100000` shows an invalid swatch. The stored value is still correct.
- **`Inspector.show()` throws**, and `Tab.hide()` hides the tab's toolbar icon along with it, leaving nothing to click. To collapse a panel the way its icon does, click the icon.
- **Building a folder forces the panel open**, and that isn't persisted — the only way to start collapsed is to close it after the folders exist, which is why `useParametersToggle` is called last.

`lib/inspector.ts` holds every cast needed for the parts `@types/three` omits, plus the ordering workaround that keeps the save button below the folders. Don't spread those casts further.

# Rejected on purpose

Each was built, used, and removed. Don't reintroduce without a concrete reason.

- `useTweakEffect` — a store subscription outside React, optimising a cost a dev panel doesn't have.
- Configs split by channel (`CUBE` vs `CUBE_LIVE`). Same reason.
- A generated store (`CONFIGS` registry, `syncConfig<K>`). Saved one line per domain, cost readability.
- Row files (`cubeRows.ts`) — scattered the tweaks and made values unreadable elsewhere.
- Auto-syncing rows by walking `group.objects` — hides the wiring.
- A schema/defaults wrapper over the addon — that's rebuilding Leva on an API that already binds to live objects.
