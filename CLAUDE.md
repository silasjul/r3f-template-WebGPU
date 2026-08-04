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

Tweaks live in the **Parameters** tab of three.js's built-in WebGPU Inspector (attached in `lib/webgpu.ts`, dev-only) — Leva is gone. The panel is DOM owned by the renderer, not React, so it never resets on re-render.

- **`lib/inspector/parameters.ts`** — all the addon plumbing, no React. Builds folders and rows, orders them, works around the typing and lifecycle gaps in `@types/three`.
- **`hooks/inspector/useTweaks.ts`** — thin hooks over that: `useTweaks`, `useTweakSelect`, `useTweakButton`.
- **Config** — `configs/<name>Config.ts`. Exports a `<Name>Config` type and a `<NAME>_DEFAULTS` object.
- **Folder hook** — `hooks/inspector/use<Name>Tweaks.ts`. Module-level `SCHEMA`, then `useTweaks('<Label>', <NAME>_DEFAULTS, SCHEMA, onChange)`.
- **Tweaks** — `components/Tweaks.tsx`. Calls the hooks that outlive a scene swap (scene picker, global folders, buttons) and renders `null`.

`<Tweaks />` must be **inside** the Canvas — `useTweaks` reaches the Inspector through `useThree((s) => s.gl).inspector`.

Top-level rows are ordered by the `order` option, not by insertion, so a folder rebuilt during a swap keeps its slot: picker `-100`, folders `0`, buttons `100`.

## The two channels

`useTweaks` just calls `onChange(values)` on every edit. What that callback does decides whether React runs at all — pick per field, not per folder.

- **Store channel** — `onChange` is a zustand setter. Subscribers re-render. Use it only when a value changes the React tree: geometry that must be rebuilt, conditional rendering, anything feeding `useMemo`. `useFogTweaks` and `useTerrainTweaks` take this route.
- **Direct channel** — `onChange` mutates three.js objects held in refs. Nothing re-renders; the next frame just draws differently. Use it for material properties, uniforms, transforms, and anything read inside `useFrame`. `CubeScene` does this for colour, wireframe and spin.

`CubeScene` mixes both in one folder: `size` goes to the store because the geometry rebuilds, everything else is a direct mutation. Note it calls `setCubeSize` unconditionally — zustand compares the selected value with `Object.is`, so passing an unchanged number wakes no subscriber.

Mutate through **refs**, not values returned from `useThree` — `react-hooks/immutability` rejects the latter.

Top-level rows are ordered by the `order` option, not by insertion, so a folder rebuilt during a swap keeps its slot: picker `-100`, folders `0`, buttons `100`.

## Schema

`useTweaks` infers the control from `typeof <NAME>_DEFAULTS[key]`; the schema only adds what can't be inferred. Every field is optional, and a key with no entry still gets a control.

- `number` — `{ min, max, step }` for a slider, nothing for a plain number input
- `boolean` / `string` — nothing needed
- colors — `{ color: true }` (values stay `'#rrggbb'` strings)
- dropdowns — `{ options: [...] | { label: value } }`
- `{ label: 'nicer name' }` renames the row
- `{ folder: 'Noise/Detail' }` nests the row; subfolders are created on first use, in key order

Folders start **closed**. Pass `{ open: true }` as the 5th arg to `useTweaks` to open the top-level one; subfolders always start closed.

Buttons use `useTweakButton(label, onClick)` with a `useCallback`'d handler — see `hooks/inspector/useLogButton.ts`. They sit at the bottom of the tab outside any folder, so they stay visible while folders are collapsed.

Pass module-level `defaults`/`schema` and a stable `onChange`; the folder is rebuilt whenever those identities change.

# Scenes

`components/scenes/registry.ts` maps a `SceneId` to a label and a component. `<ActiveScene />` in `components/Scene.tsx` renders whichever one `useTweakStore((s) => s.sceneId)` names, and the **Scene** dropdown at the top of the Parameters tab switches it.

A scene component calls its own tweak hooks, so its folders mount and unmount with it — that teardown is `useTweaks`' effect cleanup, nothing scene-specific. Folders that should survive a swap (fog) belong in `<Tweaks />` instead.

## Add a scene

1. `components/scenes/<Name>Scene.tsx` — call `useTweaks` (or a `use<Name>Tweaks` hook), return the contents.
2. `components/scenes/registry.ts` — add the entry; `SceneId` and the dropdown pick it up.

Per-object tweaks work the same way: give `useTweaks` a `defaults`/`onChange` pair derived from the selected object (`useMemo`/`useCallback` on it) and the folder rebuilds on every selection change. Transforms belong on the direct channel.

## Add a new folder (e.g. "sphere")

1. `configs/sphereConfig.ts` — a `SphereConfig` type and `SPHERE_DEFAULTS`.
2. `stores/tweakStore.ts` — add `sphere: SphereConfig` + `setSphere`, initialised to `SPHERE_DEFAULTS`.
3. `hooks/inspector/useSphereTweaks.ts` — copy `useFogTweaks`, swap in the sphere config and `setSphere`.
4. `components/Tweaks.tsx` — call `useSphereTweaks()`.
5. Consume it: `const { ... } = useTweakStore((s) => s.sphere)`.
