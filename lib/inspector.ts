import type { Inspector } from 'three/addons/inspector/Inspector.js';
import type { ParametersGroup } from 'three/addons/inspector/tabs/Parameters.js';

export type { ParametersGroup };

/** `Item.parent`, `Item.userData` and `Inspector.parameters` are absent from @types/three. */
type Row = { parent: List | null; domElement: HTMLElement; userData: Record<string, unknown> };
type List = {
  children: Row[];
  domElement: HTMLElement;
  add: (row: Row) => void;
  remove: (row: Row) => void;
};
type Group = { paramList: Row & { children: Row[] } };
type Editor = { name: (label: string) => Editor };

/** `builtinButton` is the tab's icon in the toolbar; its click handler is the real toggle. */
type ParametersTab = { groups: unknown[]; builtinButton?: HTMLButtonElement };

/** Folders sort above buttons, so the save button stays last however folders are rebuilt. */
const FOLDER = 0;
const BUTTON = 100;

/** Null in production, where the Inspector is never attached. */
export function getInspector(renderer: object): Inspector | null {
  const candidate = (renderer as { inspector?: Inspector }).inspector;

  return typeof candidate?.createParameters === 'function' ? candidate : null;
}

/** The Parameters tab itself — `Inspector.parameters` is absent from @types/three. */
export function getParametersTab(inspector: Inspector): ParametersTab {
  return (inspector as unknown as { parameters: ParametersTab }).parameters;
}

/** The tab only ever appends, so every root row is re-sorted by the order stamped on it. */
function sortRoot(list: List, row: Row, order: number) {
  row.userData.order = order;

  const sorted = [...list.children].sort(
    (a, b) => ((a.userData.order as number) ?? 0) - ((b.userData.order as number) ?? 0)
  );

  list.children.length = 0;
  list.children.push(...sorted);

  for (const child of sorted) list.domElement.appendChild(child.domElement);
}

/** `createGroup` pushes into a registry it never cleans, so every removed folder leaks. */
function dropGroup(inspector: Inspector, group: ParametersGroup) {
  const { groups } = getParametersTab(inspector);
  const index = groups.indexOf(group);

  if (index !== -1) groups.splice(index, 1);
}

/** Builds a folder and returns its teardown — the addon has no removal API. */
export function addFolder(
  inspector: Inspector,
  name: string,
  build: (group: ParametersGroup) => void
) {
  const group = inspector.createParameters(name);
  build(group);

  const { paramList } = group as unknown as Group;
  if (paramList.parent) sortRoot(paramList.parent, paramList, FOLDER);

  return () => {
    paramList.parent?.remove(paramList);
    dropGroup(inspector, group);
  };
}

/**
 * A bare button pinned below every folder. The addon only builds rows inside groups,
 * so the row is reparented onto the tab's root list and the empty header is dropped.
 */
export function addButton(inspector: Inspector, label: string, onClick: () => void) {
  const group = inspector.createParameters(label);
  (group.add({ action: onClick }, 'action') as unknown as Editor).name(label);

  const { paramList } = group as unknown as Group;
  const list = paramList.parent;
  const row = paramList.children[0];

  dropGroup(inspector, group);

  if (!list || !row) return undefined;

  list.add(row);
  list.remove(paramList);
  row.domElement.classList.remove('header-wrapper');
  sortRoot(list, row, BUTTON);

  return () => row.parent?.remove(row);
}

/** Colour rows hand back a packed int whatever you passed in. */
function hex(value: unknown): string {
  if (typeof value === 'number') return `#${(value >>> 0).toString(16).padStart(6, '0')}`;
  if (typeof value === 'string') return value.startsWith('#') ? value : `#${value}`;

  return '#000000';
}

/**
 * The one row that isn't plain `group.add`. A colour editor reports a packed int
 * whatever you passed in, so this writes `'#rrggbb'` back into the config before
 * syncing — which is what keeps a `log configs` dump pasteable.
 */
export function colorRow<T extends object>(
  group: ParametersGroup,
  config: T,
  key: keyof T & string,
  sync: () => void
) {
  return group.addColor(config, key).onChange((value) => {
    (config as Record<string, unknown>)[key] = hex(value);
    sync();
  });
}
