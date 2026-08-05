@AGENTS.md

# Verifying a feature

When you finish a feature, verify it with **only** these two checks, and only if it seems worthwhile:

- `npm run lint`
- `npx tsc --noEmit`

Never run `npm run build` or start the dev server. Ask the user to check for you.

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
hooks/          one hook per panel folder
inspector/      the tweak engine — vendored, don't edit
stores/         tweakStore.ts
```

- `inspector/` is off-limits. It has its own `AGENTS.md`; adding a tweak never means touching it.
- `lib/` doesn't exist yet. Create it for framework-free code — DOM, three.js, maths. Geometry and shader authoring belongs there, never in a component.
- A component reads what it needs from the store and renders, short enough to take in at a glance.

# Tweaks

Tweaks are written with **`useControls`** — Leva's API, reimplemented over the **Parameters** tab of three.js's built-in WebGPU Inspector (attached in `inspector/renderer.ts`, dev-only). Leva itself is not a dependency, but a tweak hook copied from a Leva project should work unchanged. Press **`h`** to collapse and reopen the panel.

Flow: **`config → hook → InspectorControls → store → consumer`**. To add a folder, e.g. "sphere":

1. `configs/sphereConfig.ts` — a `SphereConfig` type and `export const SPHERE_DEFAULTS: SphereConfig = { ... }`.
2. `stores/tweakStore.ts` — `sphere: SPHERE_DEFAULTS` and `setSphere`, two lines.
3. `hooks/useSphereTweaks.ts` — one `useControls` call, then mirror what it returned into the store:
   ```ts
   const setConfig = useTweakStore((s) => s.setSphere);

   const { size } = useControls('Sphere', {
     size: { value: SPHERE_DEFAULTS.size, min: 1, max: 40, step: 0.5 },
   });

   useEffect(() => {
     setConfig({ size });
   }, [setConfig, size]);
   ```
4. `components/InspectorControls.tsx` — call the hook. The single registration point.
5. Read it anywhere: `const { size } = useTweakStore((s) => s.sphere)`.

`useControls` reaches the Inspector through a module singleton, not through R3F — so it works in **any** component, inside or outside the Canvas. `<InspectorControls />` sits beside `<Scene />` in `app/page.tsx` so a Canvas re-render never touches the panel. Call each hook exactly once; twice builds the folder twice. If a folder should mount and unmount with something (a swappable scene, a selected object), call its hook from that component instead — a folder's lifetime follows its caller.

In production no Inspector is ever attached, so `useControls` returns the schema's own values and never renders anything.

## Throwaway scenes

The config/store layer buys **saving** and **reading a tweak from any component**. A one-off demo needs neither, and `useParameters` lets a row bind straight to a live object — the one thing `useControls` can't do, because it owns its own value map:

```ts
useParameters('Cube', (group) => {
  group.addColor(material.current, 'color');   // done. mutates the live Color.
  group.add(material.current, 'wireframe');
});
```

Reach for the full flow when a value has to survive a paste-back or be read elsewhere — not by default.

## Saving

Tune, hit `log configs`, right-click the logged object → *Copy object*, paste back into `configs/`. It dumps the store minus its setters. Colours come back as `'#rrggbb'` whatever you wrote in the schema, so a dump is always pasteable.

## The one real cost: `args` vs props

A prop sets a value on an object that already exists — `color`, `intensity`, `position`. Cheap however often it changes.

`args` are **constructor** arguments. R3F shallow-compares them and rebuilds the object when they differ, so `<boxGeometry args={[size, size, size]} />` genuinely disposes and rebuilds the geometry on every `size` change.

So the only thing to think about is when a render **reconstructs** something:

- key expensive `useMemo`s on just the fields that affect them, not a whole slice
- if a folder mixes cheap values with something expensive, split it into two configs so the cheap rows can't invalidate the expensive memo
- for something read every frame, `useTweakStore.getState()` inside `useFrame` skips the subscription — but only bother if the component is genuinely expensive

# The schema

Four call shapes, all Leva's: `useControls(schema)`, `useControls(schema, settings)`, `useControls(name, schema)`, `useControls(name, schema, settings)`. Any of them takes a trailing `deps` array, which is the only thing that rebuilds a folder. `settings` is `{ collapsed?, order? }`.

A schema value is either the value itself or a `{ value, ... }` spec. The widget follows from it:

| you write | you get |
| --- | --- |
| `4` | drag-input |
| `{ value: 4, min: 0, max: 10, step: 1 }` | slider |
| `true` | checkbox |
| `'#c98f5a'`, `'royalblue'` | colour picker — any string CSS can parse as a colour |
| `'hello'` | text |
| `{ options: ['a', 'b'] }` or `{ options: { Label: value } }` | dropdown |
| `{ x: 0, y: 0 }`, `{ x: 0, y: 0, z: 0 }`, `[0, 0]`, `[0, 0, 0]` | one row of numbers side by side |
| `{ value: [1, 5], min: 0, max: 10 }` | interval — two numbers that push rather than cross |
| `button(() => …)` | full-width button, the key is the label |
| `folder({ … }, { collapsed: true })` | nested folder; its values **flatten** into the returned object |

Any spec also takes `label`, `hint`, `disabled`, `order`, `onChange`, `transient`, and `render: (get) => boolean`. Leva's transient rule holds: an input with `onChange` is left out of the returned object unless you also pass `transient: false`. `render`'s `get` only sees keys from the same `useControls` call — there are no cross-call paths.

`onChange` gets no contextual type from the schema, so annotate it: `onChange: (value: number) => …`.

Not built, because the Inspector has no widget for them: image, joystick pad, `optional`, `buttonGroup`, `monitor`.

How any of it works, and the upstream bugs it steers around, is in `inspector/AGENTS.md`. You shouldn't need it to write a tweak.
