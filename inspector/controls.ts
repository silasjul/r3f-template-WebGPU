import type { Inspector } from 'three/addons/inspector/Inspector.js';
import {
  addFolder,
  addRootRows,
  addon,
  hex,
  rowOf,
  setDisabled,
  setHint,
  setVisible,
  vectorRow,
  type Options,
  type ParametersGroup,
  type Target,
} from './addon';

export type Schema = Record<string, unknown>;

export type FolderSettings = { collapsed?: boolean; order?: number };

export type ButtonInput = { __control: 'button'; onClick: () => void };
export type FolderInput<S extends Schema = Schema> = {
  __control: 'folder';
  schema: S;
  settings: FolderSettings;
};

/** A full-width button row. The schema key is the label. */
export function button(onClick: () => void): ButtonInput {
  return { __control: 'button', onClick };
}

/** A nested folder. Its values flatten into the object `useControls` returns. */
export function folder<S extends Schema>(schema: S, settings: FolderSettings = {}): FolderInput<S> {
  return { __control: 'folder', schema, settings };
}

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (
  arg: infer I
) => void
  ? I
  : never;

type ValueOf<I> = I extends { options: infer O }
  ? O extends readonly (infer T)[]
    ? T
    : O[keyof O]
  : I extends { value: infer V }
    ? V
    : I;

/** Buttons and transient inputs are absent from the returned object, exactly as in Leva. */
type Infer<I> = I extends ButtonInput
  ? never
  : I extends FolderInput
    ? never
    : I extends { transient: false }
      ? ValueOf<I>
      : I extends { onChange: (...args: never[]) => void }
        ? never
        : ValueOf<I>;

type Own<S> = { [K in keyof S as [Infer<S[K]>] extends [never] ? never : K]: Infer<S[K]> };

/** `UnionToIntersection<never>` is `unknown`, so a folder-free schema intersects harmlessly. */
type Nested<S> = UnionToIntersection<
  { [K in keyof S]: S[K] extends FolderInput<infer C> ? Values<C> : never }[keyof S]
>;

export type Values<S> = Simplify<Own<S> & Nested<S>>;

type Spec = {
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  options?: Options;
  hint?: string;
  disabled?: boolean;
  onChange?: (value: never) => void;
  transient?: boolean;
  order?: number;
  render?: (get: (key: string) => unknown) => boolean;
};

type Kind = 'select' | 'boolean' | 'range' | 'number' | 'color' | 'string' | 'vector' | 'interval';

const AXES = ['x', 'y', 'z'];

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isButton(input: unknown): input is ButtonInput {
  return isRecord(input) && input.__control === 'button';
}

function isFolder(input: unknown): input is FolderInput {
  return isRecord(input) && input.__control === 'folder';
}

function isVector(value: unknown): value is Record<string, number> {
  return isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';
}

/**
 * Leva's own rule: an object carrying `value` or `options` is a full input spec, anything else is
 * the value itself — which is what lets `{ x: 0, y: 0 }` mean a vector rather than a settings bag.
 */
function toSpec(input: unknown): Spec {
  if (isRecord(input) && ('value' in input || 'options' in input)) return input as Spec;

  return { value: input };
}

/**
 * Normalises any CSS colour to `#rrggbb`, and returns null for a string that isn't one. Canvas
 * `fillStyle` is the parser; two different fallbacks agreeing is the only reliable "it parsed" signal.
 */
export function toHex(value: string): string | null {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;

  context.fillStyle = '#000000';
  context.fillStyle = value;
  const black = context.fillStyle;

  context.fillStyle = '#ffffff';
  context.fillStyle = value;

  return black === context.fillStyle && black.startsWith('#') ? black : null;
}

function selectDefault(options: Options) {
  return Array.isArray(options) ? options[0] : Object.values(options)[0];
}

function kindOf(spec: Spec): Kind {
  const { value, min, max } = spec;
  const bounded = min !== undefined && max !== undefined;

  if (spec.options) return 'select';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return bounded ? 'range' : 'number';
  if (typeof value === 'string') return toHex(value) ? 'color' : 'string';
  if (Array.isArray(value)) return value.length === 2 && bounded ? 'interval' : 'vector';
  if (isVector(value)) return 'vector';

  return 'string';
}

function axisValues(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];

  const vector = value as Record<string, number>;

  return AXES.filter((axis) => axis in vector).map((axis) => vector[axis]);
}

function fromAxes(shape: unknown, numbers: number[]): unknown {
  if (Array.isArray(shape)) return [...numbers];

  const keys = AXES.filter((axis) => axis in (shape as object));

  return Object.fromEntries(keys.map((key, index) => [key, numbers[index]]));
}

function orderOf(input: unknown) {
  if (isFolder(input)) return input.settings.order ?? 0;
  if (isRecord(input) && typeof input.order === 'number') return input.order;

  return 0;
}

/** The addon appends, and sort is stable — so building in order is all the ordering there is. */
function ordered(schema: Schema) {
  return Object.entries(schema).sort(([, a], [, b]) => orderOf(a) - orderOf(b));
}

function isTransient(spec: Spec) {
  return spec.transient ?? spec.onChange !== undefined;
}

/** What `useControls` returns on its very first render, before any row exists. */
export function initialValues(schema: Schema): Target {
  const values: Target = {};

  for (const [key, input] of Object.entries(schema)) {
    if (isButton(input)) continue;

    if (isFolder(input)) {
      Object.assign(values, initialValues(input.schema));
      continue;
    }

    const spec = toSpec(input);
    if (isTransient(spec)) continue;

    values[key] = spec.options && spec.value === undefined ? selectDefault(spec.options) : spec.value;
  }

  return values;
}

/**
 * Builds one `useControls` call into the Parameters tab and returns its teardown. Rows bind to a
 * flat `values` object the addon writes into directly; every change then re-reads it into React.
 */
export function buildControls(
  inspector: Inspector,
  name: string | undefined,
  schema: Schema,
  settings: FolderSettings,
  onValues: (values: Target) => void
) {
  const values: Target = {};
  const returned = new Set<string>();
  const conditionals: { element: HTMLElement | null; render: NonNullable<Spec['render']> }[] = [];

  const get = (key: string) => values[key];

  const emit = () => {
    onValues(Object.fromEntries([...returned].map((key) => [key, values[key]])));

    for (const { element, render } of conditionals) setVisible(element, render(get));
  };

  const change = (key: string, spec: Spec, value: unknown) => {
    values[key] = value;
    spec.onChange?.(value as never);
    emit();
  };

  const addRow = (group: ParametersGroup, key: string, input: unknown) => {
    if (isFolder(input)) {
      const nested = addon(group).addFolder(key);
      build(nested, input.schema);

      if (input.settings.collapsed) addon(nested).close();

      return;
    }

    const api = addon(group);

    if (isButton(input)) {
      values[key] = input.onClick;
      api.addButton(values, key).name(key);

      return;
    }

    const spec = toSpec(input);
    const kind = kindOf(spec);

    const finish = (editor: { domElement: HTMLElement; name: (label: string) => unknown }) => {
      if (spec.label) editor.name(spec.label);

      return rowOf(editor);
    };

    let element: HTMLElement | null = null;

    // Every control reads `object[property]` for its starting value, so seed before adding the row.
    switch (kind) {
      case 'select': {
        const options = spec.options ?? [];
        values[key] = spec.value ?? selectDefault(options);

        const editor = api.addSelect(values, key, options);
        editor.onChange((value) => change(key, spec, value));
        element = finish(editor);
        break;
      }

      case 'boolean': {
        values[key] = spec.value;

        const editor = api.addBoolean(values, key);
        editor.onChange((value) => change(key, spec, value));
        element = finish(editor);
        break;
      }

      case 'range': {
        values[key] = spec.value;

        const editor = api.addSlider(values, key, spec.min ?? 0, spec.max ?? 1, spec.step ?? 0.01);
        editor.onChange((value) => change(key, spec, value));
        element = finish(editor);
        break;
      }

      case 'number': {
        values[key] = spec.value;

        const editor = api.addNumber(values, key, spec.min, spec.max);
        // `addNumber` takes no step — the input is the only way to set one.
        if (spec.step !== undefined) editor.input.step = String(spec.step);

        editor.onChange((value) => change(key, spec, value));
        element = finish(editor);
        break;
      }

      case 'color': {
        // Seeding a padded `#rrggbb` also dodges `_getColorHex`, which skips `padStart`.
        values[key] = toHex(String(spec.value)) ?? '#000000';

        const editor = api.addColor(values, key);
        editor.onChange((value) => change(key, spec, hex(value)));
        element = finish(editor);
        break;
      }

      case 'string': {
        values[key] = spec.value;

        const editor = api.addString(values, key);
        editor.onChange((value) => change(key, spec, value));
        element = finish(editor);
        break;
      }

      case 'vector':
      case 'interval': {
        values[key] = spec.value;

        const axes = axisValues(spec.value).map((value) => ({
          value,
          min: spec.min,
          max: spec.max,
          step: spec.step,
        }));

        const row = vectorRow(group, spec.label ?? key, axes, (index, value) => {
          const next = [...axisValues(values[key])];
          next[index] = value;

          if (kind === 'interval') clampInterval(next, index, row.inputs);

          change(key, spec, fromAxes(spec.value, next));
        });

        if (kind === 'vector') {
          row.inputs.forEach((input, index) => {
            input.title = AXES[index] ?? String(index);
          });
        }

        element = row.element;
        break;
      }
    }

    if (spec.hint) setHint(element, spec.hint);
    if (spec.disabled) setDisabled(element, true);
    if (spec.render) conditionals.push({ element, render: spec.render });
    if (!isTransient(spec)) returned.add(key);
  };

  const build = (group: ParametersGroup, entries: Schema) => {
    for (const [key, input] of ordered(entries)) addRow(group, key, input);
  };

  const teardown =
    name === undefined
      ? addRootRows(inspector, (group) => build(group, schema))
      : addFolder(inspector, name, (group) => {
          build(group, schema);

          if (settings.collapsed) addon(group).close();
        });

  // Colours come back normalised, so React has to be told what the panel actually holds.
  emit();

  return teardown;
}

/** Drag one end of an interval past the other and it pushes, rather than snapping back. */
function clampInterval(next: number[], index: number, inputs: HTMLInputElement[]) {
  if (next[0] <= next[1]) return;

  const other = index === 0 ? 1 : 0;
  next[other] = next[index];

  // Writing the input directly; `setValue` dispatches a change and would recurse.
  inputs[other].value = String(next[other]);
}
