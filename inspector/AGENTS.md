# Don't edit anything in this folder

This is vendored infrastructure: Leva's `useControls` API, reimplemented over the **Parameters** tab
of three.js's built-in WebGPU Inspector. Leva itself is not a dependency.

**A request to add, change or remove a tweak never means changing a file in here.** Tweaks are
authored in:

- `configs/` — one `<NAME>_DEFAULTS` object per domain
- `hooks/` — one `use<Name>Tweaks.ts` per panel folder
- `stores/tweakStore.ts` — one slice + setter per domain
- `components/InspectorControls.tsx` — the single registration point

The recipe lives in the root `CLAUDE.md`. Follow it; it does not touch this folder.

Change something here only when asked to, or when a three.js upgrade has actually broken it.

## What you may call from outside

| from | what |
| --- | --- |
| `@/inspector/useControls` | `useControls`, `button`, `folder` |
| `@/inspector/useParameters` | `useParameters` — binds a row straight to a live object |
| `@/inspector/useParametersToggle` | `useParametersToggle` — the `h` key |
| `@/inspector/renderer` | `createWebGPURenderer` |

Everything else — `addon.ts`, `controls.ts`, and the rest of what those modules export — is internal.

Imports **inside** this folder are relative (`./addon`), never `@/`-aliased, so the folder can be
lifted out into a package without touching a line.

## Why this is fragile

It is pinned to the internals of `three/examples/jsm/inspector/`, which is new, undocumented, and
has no stability guarantee. It will break on a three.js upgrade.

**`@types/three` is not the source of truth here.** `tabs/Parameters.d.ts` declares only
`add`/`addFolder`/`addColor` — `addNumber`, `addSlider`, `addBoolean`, `addString`, `addSelect`,
`addButton`, `close()` and `objects` all ship but are undeclared — and it invents an
`addColor(…, rgbScale)` parameter that does not exist in the JS. `ui/Item.d.ts` declares a
constructor and `domElement` and nothing else. `ui/List.js` has no declaration at all.

So: **read the JavaScript in `node_modules/three/examples/jsm/inspector/`.** Never the `.d.ts`, and
never from memory.

## Shape

- `addon.ts` — the Inspector singleton (`setInspector` / `onInspector`), the `Addon` type that
  matches the shipped JS, folder and root-row plumbing, the compound vector row, and small DOM
  helpers. **Every cast in the project lives here.** Don't put one anywhere else.
- `controls.ts` — the Leva schema layer: type inference, `button`, `folder`, `initialValues`,
  and the schema→row dispatch. Framework-free; no React.
- `renderer.ts` — `createWebGPURenderer`, plus the R3F `ThreeElements` module augmentation that
  makes `<meshStandardNodeMaterial />` and friends typecheck. Deleting that `declare module` block
  breaks every node-material element in the project.
- `useControls.ts` / `useParameters.ts` / `useParametersToggle.ts` — the React layer, and the only
  React in the folder.

## Traps, verified against source

- **A colour editor reports a packed int** whatever you passed in, and `_getColorHex` skips
  `padStart`, so a colour below `0x100000` renders as an invalid swatch. Both are dodged by seeding
  the row with a normalised `'#rrggbb'` string and writing one back on change. Never hand `addColor`
  a number.
- **`.listen()` never stops.** It rAF-polls the bound object with no cancellation. Nothing uses it,
  and on a select or colour row it is an infinite dispatch loop, since neither overrides `setValue`.
- **`ValueNumber` leaks two `document` listeners per control**, permanently, and a slider composes a
  `ValueNumber` so it leaks two. Upstream's bug; every folder rebuild adds more. Accepted — this is
  dev-only and shadowing the class to fix it isn't worth it.
- **`Inspector.show()` throws** (it calls `Profiler.show()` with no tab), and `Tab.hide()` hides the
  tab's toolbar icon along with it, leaving nothing to click. To collapse a panel the way its icon
  does, click the icon — which is what `useParametersToggle` does.
- **Building a folder forces the panel open**, and that isn't persisted. So `useParametersToggle` is
  called last in `InspectorControls`, and `onInspector` fires its listeners in subscription order to
  keep hook call order meaningful.
- **The addon only appends.** `Item.add(item, index)` takes an index, but `List.add(item)` does not —
  root-level ordering is done by re-sorting the whole list on a stamped `userData.order`.
- **A text row fires on every keystroke**, so a string input re-renders per character. Fine for a dev
  panel; don't debounce it.
- **`add()` returns `null`** for a value it has no widget for, so a chained `.name()` throws. The
  schema layer never relies on `add()`'s dispatch — it calls the specific `addX` method.
