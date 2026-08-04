import type { Inspector } from 'three/addons/inspector/Inspector.js';

export type TweakOptions = {
  label?: string;
  /** Slash-separated subfolder path, e.g. `'Noise/Warp'`. */
  folder?: string;
  min?: number;
  max?: number;
  step?: number;
  color?: boolean;
  options?: readonly string[] | Record<string, string | number>;
};

export type TweakSchema<T> = Partial<Record<keyof T, TweakOptions>>;

export type TweakFolderOptions = {
  /** Subfolders always start closed. */
  open?: boolean;
  /** Lower sorts nearer the top of the tab. Folders rebuilt on a swap keep their slot. */
  order?: number;
};

/**
 * ParametersGroup's `add` overloads resolve on the concrete value type, which a
 * generic `keyof T` can never satisfy, and its `close` is missing from @types/three.
 */
type Editor = {
  name: (label: string) => Editor;
  onChange: (callback: (value: unknown) => void) => Editor;
};

type Row = { parent: List | null; domElement: HTMLElement; userData: Record<string, unknown> };

type List = {
  add: (row: Row) => void;
  remove: (row: Row) => void;
  children: Row[];
  domElement: HTMLElement;
};

type Group = {
  add: (object: object, property: string, ...params: unknown[]) => Editor;
  addColor: (object: object, property: string) => Editor;
  addFolder: (name: string) => Group;
  close: () => Group;
  paramList: Row & { children: Row[] };
};

/** Null in production, where the Inspector is never attached. */
export function getInspector(renderer: object): Inspector | null {
  const candidate = (renderer as { inspector?: unknown }).inspector as Inspector | undefined;

  return typeof candidate?.createParameters === 'function' ? candidate : null;
}

/** ValueColor reports a packed int for string-backed properties. */
function toHex(value: unknown): string {
  if (typeof value === 'number') return `#${(value >>> 0).toString(16).padStart(6, '0')}`;
  if (typeof value === 'string') return value.startsWith('#') ? value : `#${value}`;
  if (value && typeof value === 'object' && 'getHexString' in value) {
    return `#${(value as { getHexString: () => string }).getHexString()}`;
  }

  return '#000000';
}

/** The tab appends new rows last, so every top level entry is re-sorted by its order. */
function place(list: List, row: Row, order: number) {
  row.userData.order = order;

  const sorted = [...list.children].sort(
    (a, b) => ((a.userData.order as number) ?? 0) - ((b.userData.order as number) ?? 0)
  );

  list.children.length = 0;
  list.children.push(...sorted);

  for (const child of sorted) list.domElement.appendChild(child.domElement);
}

/** `createGroup` pushes into a registry it never cleans, which leaks across swaps. */
function dropGroup(inspector: Inspector, group: Group) {
  const groups = (inspector as unknown as { parameters?: { groups?: unknown[] } }).parameters?.groups;
  const index = groups?.indexOf(group) ?? -1;

  if (groups && index !== -1) groups.splice(index, 1);
}

/**
 * The addon only builds rows inside groups, so the row is reparented onto the tab's
 * root list and the now-empty group header is dropped.
 */
function addRootRow(
  inspector: Inspector,
  label: string,
  build: (group: Group) => Editor,
  order: number
) {
  const group = inspector.createParameters(label) as unknown as Group;
  build(group).name(label);

  const list = group.paramList.parent;
  const row = group.paramList.children[0];

  dropGroup(inspector, group);

  if (!list || !row) return undefined;

  list.add(row);
  list.remove(group.paramList);
  row.domElement.classList.remove('header-wrapper');
  place(list, row, order);

  return () => row.parent?.remove(row);
}

/** Builds a folder of controls over a copy of `defaults`. Returns its teardown. */
export function buildFolder<T extends Record<string, unknown>>(
  inspector: Inspector,
  folder: string,
  defaults: T,
  schema: TweakSchema<T>,
  onChange: (values: T) => void,
  { open = true, order = 0 }: TweakFolderOptions = {}
) {
  const state: T = { ...defaults };
  const root = inspector.createParameters(folder) as unknown as Group;
  const push = () => onChange({ ...state });

  const subfolders = new Map<string, Group>();

  const resolveFolder = (path?: string): Group => {
    if (!path) return root;

    const cached = subfolders.get(path);
    if (cached) return cached;

    const split = path.lastIndexOf('/');
    const parent = split === -1 ? root : resolveFolder(path.slice(0, split));
    const created = parent.addFolder(split === -1 ? path : path.slice(split + 1));

    subfolders.set(path, created);

    return created;
  };

  for (const key of Object.keys(state)) {
    const field = schema[key as keyof T] ?? {};
    const value = state[key];
    const group = resolveFolder(field.folder);

    let editor: Editor;

    if (field.options) {
      editor = group.add(state, key, field.options).onChange(push);
    } else if (field.color) {
      editor = group.addColor(state, key).onChange((raw) => {
        (state as Record<string, unknown>)[key] = toHex(raw);
        push();
      });
    } else if (typeof value === 'number' && field.min !== undefined && field.max !== undefined) {
      editor = group.add(state, key, field.min, field.max, field.step).onChange(push);
    } else {
      editor = group.add(state, key).onChange(push);
    }

    if (field.label) editor.name(field.label);
  }

  for (const subfolder of subfolders.values()) subfolder.close();
  if (!open) root.close();

  const list = root.paramList.parent;
  if (list) place(list, root.paramList, order);

  return () => {
    dropGroup(inspector, root);
    root.paramList.parent?.remove(root.paramList);
  };
}

/** A dropdown row outside any folder. `options` maps a display label to its value. */
export function buildSelect<T extends string>(
  inspector: Inspector,
  label: string,
  options: Record<string, T>,
  value: T,
  onChange: (value: T) => void,
  order: number
) {
  const state = { value };

  return addRootRow(
    inspector,
    label,
    (group) => group.add(state, 'value', options).onChange(() => onChange(state.value)),
    order
  );
}

/** A button row outside any folder. */
export function buildButton(
  inspector: Inspector,
  label: string,
  onClick: () => void,
  order: number
) {
  return addRootRow(inspector, label, (group) => group.add({ action: onClick }, 'action'), order);
}
