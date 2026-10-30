/**
 * A column resolved against the reader's arrangement of it, and the moves
 * that arrangement can make. The state is normalized before anything reads
 * it: a saved view names columns the model may have dropped, and a model may
 * have columns the view never saw.
 */

import { COMPACT_BELOW, EXPANDED_FROM } from '../measure';
import type {
  GridColumn,
  GridColumnOverflow,
  GridColumnState,
  GridColumnStateChange,
  GridOutOfSpace,
  GridPinZone,
  ResolvedGridColumn,
} from './types';

export const DEFAULT_COLUMN_WIDTH = 150;
export const DEFAULT_COLUMN_MIN_WIDTH = 48;
/** Pixels a keyboard resize moves by. */
export const RESIZE_STEP = 8;

export function emptyColumnState(): GridColumnState {
  return { order: [], widths: {}, hidden: [], pinned: { start: [], end: [] } };
}

function unique(keys: readonly string[]): string[] {
  return [...new Set(keys)];
}

/**
 * The state with nothing the model cannot answer: an unknown column leaves
 * every list, a column missing from the order joins it where the model puts
 * it, and a column pinned to both edges keeps the first. A width outside the
 * column's own bounds is clamped.
 */
export function normalizeColumnState<Row>(
  state: Partial<GridColumnState> | null | undefined,
  columns: readonly GridColumn<Row>[],
): GridColumnState {
  const known = new Set(columns.map((column) => column.id));
  const keep = (keys: readonly string[] | undefined) =>
    unique((keys ?? []).filter((key) => known.has(key)));

  /* A column the state ordered before one the model puts first keeps the
     state's answer; a new column lands where the model declares it, after the
     columns declared before it. */
  const declared = columns.map((column) => column.id);
  const fromState = keep(state?.order);
  const merged: string[] = [...fromState];
  for (const id of declared) {
    if (merged.includes(id)) continue;
    const before = declared.slice(0, declared.indexOf(id)).filter((key) => merged.includes(key));
    const at = before.length === 0 ? 0 : Math.max(...before.map((key) => merged.indexOf(key))) + 1;
    merged.splice(at, 0, id);
  }

  /* A state that says where columns are pinned is the answer; without one,
     the model's: a column's own `pinned`, and `end` for the row's actions. */
  const modelPins = (zone: 'start' | 'end') =>
    columns
      .filter(
        (column) =>
          (column.pinned !== undefined
            ? column.pinned
            : column.kind === 'actions'
              ? 'end'
              : null) === zone,
      )
      .map((column) => column.id);
  const start = state?.pinned ? keep(state.pinned.start) : modelPins('start');
  const end = (state?.pinned ? keep(state.pinned.end) : modelPins('end')).filter(
    (key) => !start.includes(key),
  );

  const widths: Record<string, number> = {};
  for (const column of columns) {
    const width = state?.widths?.[column.id];
    if (typeof width !== 'number' || !Number.isFinite(width)) continue;
    widths[column.id] = clampWidth(column, width);
  }

  return { order: merged, widths, hidden: keep(state?.hidden), pinned: { start, end } };
}

export function clampWidth<Row>(column: GridColumn<Row>, width: number): number {
  const min = column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
  const max = column.maxWidth ?? Number.POSITIVE_INFINITY;
  return Math.round(Math.min(max, Math.max(min, width)));
}

const ENGINE_KINDS = new Set(['text', 'number', 'date', 'time', 'datetime', 'boolean', 'set']);

/**
 * The visible columns in the order they are laid out — the start zone, the
 * middle, the end zone — each with its width, its pin offset and its index.
 * Everything a binding draws a row from.
 */
export interface ResolveColumnsOptions {
  /** Pixels already pinned at the start before the first column: the gutters. */
  readonly leading?: number | undefined;
}

export function resolveColumns<Row>(
  columns: readonly GridColumn<Row>[],
  state: GridColumnState,
  options: ResolveColumnsOptions = {},
): ResolvedGridColumn<Row>[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const hidden = new Set(state.hidden);
  const ordered = state.order.filter((id) => byId.has(id) && !hidden.has(id));
  const start = state.pinned.start.filter((id) => ordered.includes(id));
  const end = state.pinned.end.filter((id) => ordered.includes(id));
  const middle = ordered.filter((id) => !start.includes(id) && !end.includes(id));
  const laidOut: { id: string; pinned: GridPinZone }[] = [
    ...start.map((id) => ({ id, pinned: 'start' as const })),
    ...middle.map((id) => ({ id, pinned: null })),
    ...end.map((id) => ({ id, pinned: 'end' as const })),
  ];

  const widthOf = (id: string) => {
    const column = byId.get(id)!;
    return clampWidth(column, state.widths[id] ?? column.width ?? DEFAULT_COLUMN_WIDTH);
  };

  /* The start zone begins after the gutters the binding pins before it — the
     chooser and the expander — or the first pinned column stood over them. */
  let startOffset = options.leading ?? 0;
  const startOffsets = new Map<string, number>();
  for (const id of start) {
    startOffsets.set(id, startOffset);
    startOffset += widthOf(id);
  }
  let endOffset = 0;
  const endOffsets = new Map<string, number>();
  for (const id of [...end].reverse()) {
    endOffsets.set(id, endOffset);
    endOffset += widthOf(id);
  }

  return laidOut.map(({ id, pinned }, index) => {
    const column = byId.get(id)!;
    const kind = column.kind ?? 'text';
    const engine = ENGINE_KINDS.has(kind);
    return {
      column,
      id,
      kind,
      width: widthOf(id),
      minWidth: column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH,
      maxWidth: column.maxWidth,
      /* A width the reader set replaces the fraction: a flex track is sized by
         the room left over, so a resize that only wrote `widths` moved
         nothing. Resizing a flex column fixes it, as it does in AG Grid. */
      flex: id in state.widths ? undefined : column.flex,
      pinned,
      pinOffset:
        pinned === 'start' ? startOffsets.get(id)! : pinned === 'end' ? endOffsets.get(id)! : 0,
      pinEdge:
        (pinned === 'start' && id === start[start.length - 1]) ||
        (pinned === 'end' && id === end[0]),
      index: index + 1,
      sortable: column.sortable ?? kind !== 'actions',
      filterable: column.filterable ?? engine,
      searchable: column.searchable ?? engine,
      resizable: column.resizable ?? true,
      reorderable: column.reorderable ?? true,
      hideable: column.hideable ?? true,
      numeric: column.numeric ?? kind === 'number',
      align: column.align,
      text: column.text ?? 'truncate',
    };
  });
}

/** The tracks a row is laid out on: one per visible column, in layout order. */
export function columnTemplate<Row>(
  resolved: readonly ResolvedGridColumn<Row>[],
  extra: readonly number[] = [],
): string {
  const tracks = resolved.map((column) =>
    column.flex !== undefined
      ? `minmax(${column.minWidth}px, ${column.flex}fr)`
      : `${column.width}px`,
  );
  return [...extra.map((width) => `${width}px`), ...tracks].join(' ');
}

/** The state with one column's width replaced, clamped to the column's bounds. */
export function withColumnWidth<Row>(
  state: GridColumnState,
  column: GridColumn<Row>,
  width: number,
): GridColumnState {
  return { ...state, widths: { ...state.widths, [column.id]: clampWidth(column, width) } };
}

/**
 * The state with one column moved to a position in its own zone. A column
 * never leaves its zone by moving: the zone is a fact of the state, and a
 * move that changed both would carry two reasons.
 */
export function withColumnMoved(
  state: GridColumnState,
  id: string,
  toIndex: number,
  zone: readonly string[],
): GridColumnState {
  const members = zone.filter((key) => key !== id);
  const at = Math.max(0, Math.min(members.length, toIndex));
  members.splice(at, 0, id);
  /* The order holds every column; the zone's members are rewritten in place,
     in their new relative order, and every other column keeps its slot. */
  const slots = state.order
    .map((key, index) => (zone.includes(key) ? index : -1))
    .filter((index) => index >= 0);
  const order = [...state.order];
  slots.forEach((slot, index) => {
    order[slot] = members[index]!;
  });
  const pinned = { ...state.pinned };
  if (state.pinned.start.includes(id)) pinned.start = members;
  if (state.pinned.end.includes(id)) pinned.end = members;
  return { ...state, order, pinned };
}

export function withColumnHidden(
  state: GridColumnState,
  id: string,
  hidden: boolean,
): GridColumnState {
  const rest = state.hidden.filter((key) => key !== id);
  return { ...state, hidden: hidden ? [...rest, id] : rest };
}

export function withColumnPinned(
  state: GridColumnState,
  id: string,
  zone: GridPinZone,
): GridColumnState {
  const start = state.pinned.start.filter((key) => key !== id);
  const end = state.pinned.end.filter((key) => key !== id);
  return {
    ...state,
    pinned: {
      start: zone === 'start' ? [...start, id] : start,
      end: zone === 'end' ? [id, ...end] : end,
    },
  };
}

/** The zone a column belongs to, as an ordered list of ids in layout order. */
export function zoneOf<Row>(
  resolved: readonly ResolvedGridColumn<Row>[],
  id: string,
): readonly string[] {
  const column = resolved.find((entry) => entry.id === id);
  if (!column) return [];
  return resolved.filter((entry) => entry.pinned === column.pinned).map((entry) => entry.id);
}

/**
 * The state as one line of text. `order` is written only when it differs from
 * the model's, `widths` only for the columns the reader moved; a state nobody
 * touched serializes to the empty string.
 */
export function serializeColumnState(
  state: GridColumnState | null | undefined,
  columns?: readonly GridColumn<never>[],
): string {
  if (!state) return '';
  const parts: string[] = [];
  const declared = columns?.map((column) => column.id);
  const sameOrder =
    declared !== undefined &&
    declared.length === state.order.length &&
    declared.every((id, index) => id === state.order[index]);
  if (state.order.length > 0 && !sameOrder) parts.push(`o=${state.order.join(',')}`);
  const widths = Object.entries(state.widths).map(([id, width]) => `${id}:${width}`);
  if (widths.length > 0) parts.push(`w=${widths.join(',')}`);
  if (state.hidden.length > 0) parts.push(`h=${state.hidden.join(',')}`);
  /* With the model at hand, the pins are written only when they differ from
     the model's own — an `actions` column pinned to the end — and then both
     lists are written, empty or not, so the text says the reader moved them. */
  /* A state that never met the model — no order — states only the pins it holds. */
  const model =
    columns === undefined || state.order.length === 0
      ? null
      : normalizeColumnState(undefined, columns).pinned;
  const samePins =
    model !== null &&
    sameList(model.start, state.pinned.start) &&
    sameList(model.end, state.pinned.end);
  if (model !== null && !samePins) {
    parts.push(`ps=${state.pinned.start.join(',')}`, `pe=${state.pinned.end.join(',')}`);
  } else if (model === null) {
    if (state.pinned.start.length > 0) parts.push(`ps=${state.pinned.start.join(',')}`);
    if (state.pinned.end.length > 0) parts.push(`pe=${state.pinned.end.join(',')}`);
  }
  return parts.join(';');
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((entry, index) => entry === b[index]);
}

/** Whether a serialized state names its pins, rather than leaving them to the model. */
export function statesPins(text: string | null | undefined): boolean {
  return (text ?? '').split(';').some((part) => part.startsWith('ps=') || part.startsWith('pe='));
}

/**
 * Total: malformed text gives the empty state, and an unknown column survives
 * until `normalizeColumnState` meets the model.
 */
export function parseColumnState(text: string | null | undefined): GridColumnState {
  const state = emptyColumnState();
  if (!text) return state;
  const list = (value: string) => value.split(',').filter((entry) => entry !== '');
  let order = state.order;
  let hidden = state.hidden;
  let start = state.pinned.start;
  let end = state.pinned.end;
  const widths: Record<string, number> = {};
  for (const part of text.split(';')) {
    const at = part.indexOf('=');
    if (at <= 0) continue;
    const key = part.slice(0, at);
    const value = part.slice(at + 1);
    if (key === 'o') order = list(value);
    else if (key === 'h') hidden = list(value);
    else if (key === 'ps') start = list(value);
    else if (key === 'pe') end = list(value);
    else if (key === 'w') {
      for (const entry of list(value)) {
        const colon = entry.lastIndexOf(':');
        if (colon <= 0) continue;
        const width = Number(entry.slice(colon + 1));
        if (Number.isFinite(width) && width > 0) widths[entry.slice(0, colon)] = width;
      }
    }
  }
  return { order, widths, hidden, pinned: { start, end } };
}

export interface OutOfSpaceOptions {
  /** Pixels the gutters take before the first column. */
  readonly leading?: number | undefined;
}

/**
 * The columns that do not fit the frame. A flexible column asks for its floor,
 * a fixed one for its width, and the gutters for `leading`. Columns leave one
 * by one until the rest fit: first those without a `priority`, the last in the
 * row first; then the numbered ones, the highest first, and of two equal ones
 * the later. The identity column — the first with `rowHeader`, or else the
 * first that is not `actions` — never leaves, and neither does an `actions`
 * column; when only those remain the grid scrolls sideways. A frame not
 * measured yet (`available <= 0`) takes nothing out.
 */
export function columnsOutOfSpace<Row>(
  resolved: readonly ResolvedGridColumn<Row>[],
  available: number,
  options: OutOfSpaceOptions = {},
): GridOutOfSpace {
  if (!(available > 0)) return { popin: [], hidden: [] };
  const need = (column: ResolvedGridColumn<Row>) =>
    column.flex !== undefined ? column.minWidth : column.width;
  let total = (options.leading ?? 0) + resolved.reduce((sum, column) => sum + need(column), 0);
  const identity =
    resolved.find((column) => column.column.rowHeader === true) ??
    resolved.find((column) => column.kind !== 'actions');
  const rank = (column: ResolvedGridColumn<Row>) => column.column.priority ?? Infinity;
  const candidates = resolved
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => column !== identity && column.kind !== 'actions')
    .sort((a, b) => rank(b.column) - rank(a.column) || b.index - a.index);
  const out = new Set<string>();
  for (const { column } of candidates) {
    if (total <= available) break;
    out.add(column.id);
    total -= need(column);
  }
  const leaving = resolved.filter((column) => out.has(column.id));
  return {
    popin: leaving.filter((column) => column.column.popin !== false).map((column) => column.id),
    hidden: leaving.filter((column) => column.column.popin === false).map((column) => column.id),
  };
}

/**
 * The policy `auto` settles to for a frame `width` pixels wide: the pop-in
 * under `COMPACT_BELOW`, where a phone has no room to scroll through; under
 * `EXPANDED_FROM` as well when the main pointer is `coarse`, a tablet's finger;
 * a sideways scroll everywhere else, where a mouse or a trackpad scrolls and
 * the columns keep their layout. A frame not measured yet (`width <= 0`)
 * scrolls. An explicit `popin` or `scroll` is returned as it is.
 */
export function resolveColumnOverflow(
  policy: GridColumnOverflow,
  width: number,
  coarse: boolean,
): 'popin' | 'scroll' {
  if (policy !== 'auto') return policy;
  if (!(width > 0)) return 'scroll';
  return width < COMPACT_BELOW || (coarse && width < EXPANDED_FROM) ? 'popin' : 'scroll';
}

/** The keys of the state that differ between two states, in a fixed order. */
export function columnStateChanges(
  previous: GridColumnState,
  next: GridColumnState,
): GridColumnStateChange[] {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  /* Widths are a record: the same widths set in another order are the same. */
  const sameWidths = (a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>) =>
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((key) => a[key] === b[key]);
  const changes: GridColumnStateChange[] = [];
  if (!same(previous.order, next.order)) changes.push('order');
  if (!sameWidths(previous.widths, next.widths)) changes.push('width');
  if (!same(previous.hidden, next.hidden)) changes.push('hidden');
  if (!same(previous.pinned, next.pinned)) changes.push('pinned');
  return changes;
}
