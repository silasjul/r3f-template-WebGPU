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

Default to zero. A better name beats a comment every time.

**The test:** if the comment would still make sense pasted into someone else's project, delete it. It teaches, and I did not ask to be taught.

Never write these:

```ts
/** Directional light — parallel rays from one direction. The only one that can cast shadows. */
color: '#ffd9a0',        // ❌ teaches three.js. I picked the light, I know what it is.

// Its Y position; X and Z are fixed in `Light`.
height: 24,              // ❌ restates the name and the call site.

// --- helpers ---        ❌ section label. The file tree is the map.
```

Write one only when the code is **correct but looks wrong**. Then say what breaks without it:

```ts
// Assigned before init(): the renderer mounts the panel from inside its own init().
renderer.inspector = inspector;

const angle = 0.4;       // radians
```

So: a workaround for someone else's bug (name the bug), an ordering constraint (say what breaks if reordered), a line that looks simplifiable but is not (say what fails if you simplify it), or a unit the type cannot carry.

# Responses

Always talk in ASD-STE100 Simplified Technical English.
Always talk to me like I have ADHD.

# Structuring

Dont have lots of components in one file split it out and keep a really nice and clean file structure, so everything im looking for is very iontuititve and easy to find in the file tree.

The most important thing is that the components, configs and hooks folder doesnt get bloated with a million files. instead create subfodlers here for that feature or thing and group the files nicely.

The tweak panel follows the same rule — see **Tweaks**.

# Configs

`configs/` holds **values only** — no logic, no JSX, no imports from `components/` or `lib/`.

Put a value here when it is one of these:

- A **default for a tweak row** — the number the panel starts at.
- A **magic number that two or more files share**, or one I will want to change often.

The point is one place to change things. If I want a different look, I open `configs/`, not five components.

Rules:

- One file per feature, named after it: `configs/cubeScene.ts`, not `configs/cube.ts` + `configs/light.ts` + `configs/pattern.ts`. Group by scene or feature, then use a subfolder when a feature grows past one file.
- Export **`SCREAMING_CASE` objects** grouped by what they belong to: `CUBE_DEFAULTS`, `LIGHT_DEFAULTS`, `PATTERN_DEFAULTS`.
- Keep `min`, `max` and `step` at the `useControls` call, **not** in the config. The config says what the thing *is*; the panel says how far I can drag it.
- A value used once, that I will never tune, stays inline in the component. Do not move every literal here.
- Config files get **no comments** either. See **Comments** — a unit is fine, a three.js lesson is not. If a value needs a sentence to be clear, rename it.

# Tweaks

Use my own package, `tsl-inspector` — the new three.js WebGPU inspector behind a standard Leva `useControls` API, same syntax.

Two entry points, same schema:

- **`useControls`** in a component. Returns plain values and re-renders React.
- **`controls`** in a `lib/` shader. No React, so it works at module scope, and each row comes back as a **TSL uniform** you use straight in the graph. The panel writes `node.value` — no re-render, no recompile, no store.

## Panel folders mirror the file tree

A folder name is a path, so **group tweaks by feature exactly like the folders on disk**. One top folder per thing, one sub-folder per part of it. Never a flat pile of siblings at the root.

```
Cube
  Shape      <- useControls('Cube/Shape')  in components/Cube.tsx
  Pattern    <- controls('Cube/Pattern')   in lib/shaders/cubePattern.ts
Light
```

Rules:

- If two folders belong to the same object, **nest them under it**. A shader's rows go *under* the object it draws, never beside it.
- Order of arrival does not matter. A missing parent is built for you, and a folder stays up as long as anything in it does.
- Sibling sub-folders with no `order` sort by whichever registered first, which is not deterministic. **Give them `order` in settings** when the order matters.
- A path folder collapses on its own: `{ collapsed: true }` on `'Cube/Pattern'` leaves `Cube` open. `collapsed` on a folder two calls share wins for both, and nothing reopens it.
- Changing a uniform row never re-renders the component sharing that folder. The two calls only share the container.
