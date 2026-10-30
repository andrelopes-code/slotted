/**
 * The arithmetic of a dashboard: where each widget stands, what a move, a
 * resize or a hide asks for, and the text a store keeps. No DOM is read here
 * except the rectangles and points a caller passes in, so a server render and
 * a test see the same answers the browser does.
 *
 * A widget stands at a cell `x`, `y` and covers `w` columns and `h` rows of the
 * expanded class. The grid has gravity: every widget rises until something
 * stops it, and a widget put where another stands pushes that one down. It is
 * the model react-grid-layout, gridstack and Grafana share, and the one that
 * lets a widget be dropped in any cell and pulled by any side but its top.
 *
 * The widgets are drawn in the order of their rows, then their columns, so the
 * reading order, the focus order and the picture agree at every width. The
 * medium class flows that order with each width snapped to a half or the
 * whole; the compact class is one column.
 */

import { COMPACT_BELOW, EXPANDED_FROM } from '../measure';

/**
 * Sub-rows a row's step is drawn in. A row is the unit a reader moves and
 * resizes by and a store keeps; the grid's tracks are twelve times finer, so
 * a widget sized by its content ends within a twelfth of a step of it rather
 * than at the next whole row. The gap is drawn inside each widget's cell.
 * The stylesheet states the same number.
 */
export const DASHBOARD_SUBROWS = 12;

export interface DashboardLayoutItem {
  readonly key: string;
  /** Column of the expanded class, from 0 at the inline start. */
  readonly x: number;
  /** Row, from 0 at the top. */
  readonly y: number;
  /** Columns covered. */
  readonly w: number;
  /** Rows covered. */
  readonly h: number;
  readonly hidden?: boolean;
}

export type DashboardLayout = readonly DashboardLayoutItem[];

/** What a widget says about itself; the layout says what the reader did with it. */
export interface DashboardWidgetSpec {
  readonly key: string;
  /** Default 4. */
  readonly defaultColumns?: number;
  /** Default 2. */
  readonly defaultRows?: number;
  /**
   * Default 2, or the columns when fewer: one column of twelve is narrower
   * than a card's title and its detail link.
   */
  readonly minColumns?: number;
  readonly maxColumns?: number;
  /** Default 2: one row holds a card's header and nothing under it. */
  readonly minRows?: number;
  readonly maxRows?: number;
  /**
   * The sub-rows the widget's content measures (`observeContentSpan`), in
   * `DASHBOARD_SUBROWS`ths of a row's step. The widget is drawn this tall —
   * at least one sub-row, or `minRows` when the widget states it, and at most
   * `maxRows` — and the widgets below rise to it. Its rows, rounded up, are
   * what moves, resizes and announcements read.
   */
  readonly contentSpan?: number;
  /** Default true. A widget that cannot move is fixed, and the others flow around it. */
  readonly movable?: boolean;
  /** Default true. */
  readonly resizable?: boolean;
  /** Default true. */
  readonly removable?: boolean;
}

export interface DashboardColumns {
  readonly expanded: number;
  readonly medium: number;
  readonly compact: number;
}

export type DashboardColumnsInput = number | Partial<DashboardColumns>;

export type DashboardSizeClass = keyof DashboardColumns;

export type DashboardLayoutChangeKind = 'move' | 'resize' | 'hide' | 'show' | 'reset' | 'cancel';

/** What the request for a new layout was about. `key` is null for reset and cancel. */
export interface DashboardLayoutChange {
  readonly kind: DashboardLayoutChangeKind;
  readonly key: string | null;
}

export interface DashboardTile {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Where the widget is drawn, in sub-rows from the top: `y`, unless a widget above it is sized by its content. */
  readonly top: number;
  /** Sub-rows drawn: `h` steps, or the content's own height. */
  readonly span: number;
  readonly hidden: boolean;
  /** Columns of the medium class: a half or the whole. */
  readonly medium: number;
  readonly movable: boolean;
  readonly resizable: boolean;
  readonly removable: boolean;
  readonly minColumns: number;
  readonly maxColumns: number;
  readonly minRows: number;
  readonly maxRows: number;
}

export type DashboardDirection = 'left' | 'right' | 'up' | 'down';

export interface DashboardCell {
  readonly x: number;
  readonly y: number;
}

/** A place and a size, as a pointer or a key asks for them. */
export interface DashboardBox extends DashboardCell {
  readonly w: number;
  readonly h: number;
}

const DEFAULT_COLUMNS = 4;
const DEFAULT_ROWS = 2;

function whole(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function resolveColumns(input: DashboardColumnsInput | undefined): DashboardColumns {
  const named = typeof input === 'object' && input !== null ? input : {};
  const expanded = whole(typeof input === 'number' ? input : named.expanded, 12);
  return {
    expanded,
    medium: whole(named.medium, Math.ceil(expanded / 2)),
    compact: whole(named.compact, 1),
  };
}

/**
 * The class a width falls in, at the thresholds of `@slotted/core/measure`.
 * `expandedFrom` moves the expanded threshold, for a grid whose own width is
 * narrower than the page it sits in.
 */
export function sizeClassOf(width: number, expandedFrom = EXPANDED_FROM): DashboardSizeClass {
  if (width < COMPACT_BELOW) return 'compact';
  if (width < expandedFrom) return 'medium';
  return 'expanded';
}

/**
 * The medium class has two widths a widget reads well at: a half and the
 * whole. A widget of half the expanded class or less takes a half, a wider one
 * the whole, so four figures become two rows of two and a chart becomes the
 * whole width. A third of a 600-pixel grid is narrower than a figure with its
 * trend line, and a row of three over a row of one leaves two empty thirds.
 */
export function mediumSpan(w: number, grid: DashboardColumns): number {
  return w / grid.expanded <= 0.5 ? mediumHalf(grid) : grid.medium;
}

function mediumHalf(grid: DashboardColumns): number {
  return Math.max(1, Math.ceil(grid.medium / 2));
}

/** The expanded columns a medium width stands for. */
function expandedFromMedium(span: number, grid: DashboardColumns): number {
  return span >= grid.medium ? grid.expanded : Math.round(grid.expanded / 2);
}

/* ── Placement ─────────────────────────────────────────────────────────── */

interface Box {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fixed: boolean;
}

const collides = (a: Box, b: Box) =>
  a.key !== b.key && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const byPlace = (a: Box, b: Box) => a.y - b.y || a.x - b.x;

/**
 * Moves every box that `mover` covers to just below it, and every box those
 * cover in turn. A fixed box is never pushed: the mover goes below it instead.
 */
function pushDown(boxes: Box[], mover: Box, depth = 0): void {
  if (depth > boxes.length) return;
  for (const fixed of boxes) {
    if (fixed.fixed && collides(fixed, mover)) mover.y = fixed.y + fixed.h;
  }
  const hit = boxes.filter((box) => !box.fixed && box !== mover && collides(box, mover));
  hit.sort(byPlace);
  for (const box of hit) {
    box.y = mover.y + mover.h;
    pushDown(boxes, box, depth + 1);
  }
}

/** Every box rises until something stops it; fixed boxes stay where they are. */
function compact(boxes: Box[]): void {
  const placed = boxes.filter((box) => box.fixed);
  for (const box of boxes.filter((each) => !each.fixed).sort(byPlace)) {
    while (box.y > 0 && !placed.some((other) => collides({ ...box, y: box.y - 1 }, other))) {
      box.y -= 1;
    }
    while (placed.some((other) => collides(box, other))) box.y += 1;
    placed.push(box);
  }
}

/** The first cell, row by row, where a box of this size covers nothing. */
function firstFit(boxes: readonly Box[], box: Box, columns: number): void {
  for (let y = 0; ; y += 1) {
    for (let x = 0; x + box.w <= columns; x += 1) {
      if (!boxes.some((other) => collides({ ...box, x, y }, other))) {
        box.x = x;
        box.y = y;
        return;
      }
    }
  }
}

interface Limits {
  spec: DashboardWidgetSpec;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
}

function limitsOf(spec: DashboardWidgetSpec, grid: DashboardColumns): Limits {
  const minColumns = clamp(whole(spec.minColumns, 2), 1, grid.expanded);
  const maxColumns = clamp(whole(spec.maxColumns, grid.expanded), minColumns, grid.expanded);
  const minRows = whole(spec.minRows, 2);
  const maxRows = Math.max(minRows, whole(spec.maxRows, Number.MAX_SAFE_INTEGER));
  return { spec, minColumns, maxColumns, minRows, maxRows };
}

function boxOf(
  key: string,
  limits: Limits,
  item: Partial<DashboardBox> | undefined,
  grid: DashboardColumns,
): Box {
  const w = clamp(
    whole(item?.w, whole(limits.spec.defaultColumns, DEFAULT_COLUMNS)),
    limits.minColumns,
    limits.maxColumns,
  );
  const h = clamp(
    whole(item?.h, whole(limits.spec.defaultRows, DEFAULT_ROWS)),
    limits.minRows,
    limits.maxRows,
  );
  const x = clamp(Math.round(item?.x ?? 0), 0, grid.expanded - w);
  const y = Math.max(0, Math.round(item?.y ?? 0));
  return { key, x, y, w, h, fixed: limits.spec.movable === false };
}

function firstByKey(layout: DashboardLayout): Map<string, DashboardLayoutItem> {
  const byKey = new Map<string, DashboardLayoutItem>();
  for (const item of layout) if (!byKey.has(item.key)) byKey.set(item.key, item);
  return byKey;
}

type Adjust = (boxes: Box[], find: (key: string) => Box | undefined) => Box | null;

/**
 * The board a layout describes: the visible boxes, settled, and the hidden
 * ones as they were stored. `adjust` changes the boxes before they settle —
 * which is what a move, a resize and a swap are — and returns the box that
 * wins the cells it asked for.
 */
function settle(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  adjust?: Adjust,
  grow = false,
): DashboardTile[] {
  const items = firstByKey(layout);
  const limits = new Map(widgets.map((spec) => [spec.key, limitsOf(spec, grid)]));
  const seen = new Set<string>();
  const known: Box[] = [];
  const missing: Box[] = [];
  const hidden: Box[] = [];

  for (const spec of widgets) {
    if (seen.has(spec.key)) continue;
    seen.add(spec.key);
    const item = items.get(spec.key);
    const box = boxOf(spec.key, limits.get(spec.key)!, item, grid);
    if (item?.hidden === true) hidden.push(box);
    else if (item === undefined) missing.push(box);
    else known.push(box);
  }

  /* The stored boxes settle first; a widget the layout never named then
     takes the first place it fits, in the order the widgets were given. */
  compact(known);
  for (const box of missing) {
    firstFit(known, box, grid.expanded);
    known.push(box);
  }

  const mover = adjust?.(known, (key) => known.find((box) => box.key === key)) ?? null;
  if (mover !== null) {
    pushDown(known, mover);
    compact(known);
  }

  /* Drawn, not stored: a widget sized by its content takes the rows it measures. */
  const spanOf = (box: Box) => {
    const limit = limits.get(box.key)!;
    const measured = limit.spec.contentSpan;
    if (!grow || measured === undefined) return box.h * DASHBOARD_SUBROWS;
    const floor = limit.spec.minRows === undefined ? 1 : limit.minRows * DASHBOARD_SUBROWS;
    return clamp(Math.ceil(measured), floor, Math.max(floor, limit.maxRows * DASHBOARD_SUBROWS));
  };
  if (grow) {
    let grew = false;
    for (const box of [...known].sort(byPlace)) {
      const limit = limits.get(box.key)!;
      if (limit.spec.contentSpan === undefined) continue;
      const rows = Math.ceil(spanOf(box) / DASHBOARD_SUBROWS);
      if (rows <= box.h) continue;
      box.h = clamp(rows, limit.minRows, limit.maxRows);
      pushDown(known, box);
      grew = true;
    }
    if (grew) compact(known);
  }

  /* The picture, in sub-rows: every widget at its rows, a widget sized by its
     content at that height, and gravity once more, so what stands below a
     short widget rises to it rather than to the next whole row. */
  const drawn = new Map<string, Box>();
  const fine = known.map((box) => {
    const each = { ...box, y: box.y * DASHBOARD_SUBROWS, h: spanOf(box) };
    drawn.set(box.key, each);
    return each;
  });
  compact(fine);

  const tileOf = (box: Box, isHidden: boolean): DashboardTile => {
    const limit = limits.get(box.key)!;
    const picture = drawn.get(box.key);
    return {
      key: box.key,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      top: picture?.y ?? box.y * DASHBOARD_SUBROWS,
      span: picture?.h ?? box.h * DASHBOARD_SUBROWS,
      hidden: isHidden,
      medium: mediumSpan(box.w, grid),
      movable: limit.spec.movable !== false,
      resizable: limit.spec.resizable !== false,
      removable: limit.spec.removable !== false,
      minColumns: limit.minColumns,
      maxColumns: limit.maxColumns,
      minRows: limit.minRows,
      maxRows: limit.maxRows,
    };
  };
  return [
    ...known.sort(byPlace).map((box) => tileOf(box, false)),
    ...hidden.map((box) => tileOf(box, true)),
  ];
}

/**
 * Every widget, in the order it is drawn: the visible ones by row, then by
 * column, and the hidden ones after them. An entry no widget holds is not
 * drawn.
 */
export function resolveTiles(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
): DashboardTile[] {
  return settle(layout, widgets, grid, undefined, true);
}

/** The private custom properties the stylesheet places a widget by. */
export function tileStyle(tile: DashboardTile): Record<string, string> {
  return {
    '--_dg-x': String(tile.x + 1),
    '--_dg-y': String(tile.top + 1),
    '--_dg-w': String(tile.w),
    '--_dg-h': String(tile.span),
    '--_dg-span-medium': String(tile.medium),
  };
}

/** The column counts, as the private custom properties the root carries. */
export function gridStyle(grid: DashboardColumns): Record<string, string> {
  return {
    '--_dg-columns-expanded': String(grid.expanded),
    '--_dg-columns-medium': String(grid.medium),
    '--_dg-columns-compact': String(grid.compact),
  };
}

function itemOf(tile: DashboardTile): DashboardLayoutItem {
  const item = { key: tile.key, x: tile.x, y: tile.y, w: tile.w, h: tile.h };
  return tile.hidden ? { ...item, hidden: true } : item;
}

function fromTiles(
  tiles: readonly DashboardTile[],
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
): DashboardLayout {
  const known = new Set(widgets.map((widget) => widget.key));
  const orphans = [...firstByKey(layout).values()].filter((item) => !known.has(item.key));
  return [...tiles.map(itemOf), ...orphans];
}

/**
 * The layout as a request carries it: every widget where it is drawn, then the
 * entries no widget holds, untouched, so a change never drops a value the
 * consumer stored.
 */
export function materializeLayout(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
): DashboardLayout {
  return fromTiles(settle(layout, widgets, grid), layout, widgets);
}

function adjusted(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  adjust: Adjust,
): DashboardLayout {
  return fromTiles(settle(layout, widgets, grid, adjust), layout, widgets);
}

/** A widget put in a cell; what it covers moves down. A fixed widget stays. */
export function moveTile(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  cell: DashboardCell,
): DashboardLayout {
  return adjusted(layout, widgets, grid, (_, find) => {
    const box = find(key);
    if (box === undefined || box.fixed) return null;
    box.x = clamp(Math.round(cell.x), 0, grid.expanded - box.w);
    box.y = Math.max(0, Math.round(cell.y));
    return box;
  });
}

/** Two widgets exchange places; the one that moved wins the cells it lands on. */
export function swapTiles(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  other: string,
): DashboardLayout {
  return adjusted(layout, widgets, grid, (boxes, find) => {
    const mover = find(key);
    const target = find(other);
    if (mover === undefined || target === undefined || mover.fixed || target.fixed) return null;
    const from = { x: mover.x, y: mover.y };
    mover.x = clamp(target.x, 0, grid.expanded - mover.w);
    mover.y = target.y;
    target.x = clamp(from.x, 0, grid.expanded - target.w);
    target.y = from.y;
    /* The target is settled against the mover before the rest are. */
    if (collides(target, mover)) target.y = mover.y + mover.h;
    pushDown(boxes, target);
    return mover;
  });
}

/** The widget above or below: the nearest row that overlaps its columns most. */
function neighbour(
  tiles: readonly DashboardTile[],
  tile: DashboardTile,
  direction: 'up' | 'down',
): DashboardTile | undefined {
  const overlap = (other: DashboardTile) =>
    Math.min(tile.x + tile.w, other.x + other.w) - Math.max(tile.x, other.x);
  const candidates = tiles.filter(
    (other) =>
      !other.hidden &&
      other.key !== tile.key &&
      overlap(other) > 0 &&
      (direction === 'up' ? other.y + other.h <= tile.y : other.y >= tile.y + tile.h),
  );
  candidates.sort((a, b) =>
    direction === 'up'
      ? b.y + b.h - (a.y + a.h) || overlap(b) - overlap(a)
      : a.y - b.y || overlap(b) - overlap(a),
  );
  return candidates[0];
}

/**
 * One step by key. In the expanded class a widget moves a column along its
 * row, or exchanges places with the widget above or below it — gravity would
 * pull a widget that only stepped down straight back. In the classes that
 * flow, the reading order is what the reader sees, so every arrow exchanges
 * places with the widget before or after it in that order.
 */
export function moveTileBy(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  direction: DashboardDirection,
  sizeClass: DashboardSizeClass,
): DashboardLayout {
  const tiles = resolveTiles(layout, widgets, grid);
  const visible = tiles.filter((tile) => !tile.hidden);
  const index = visible.findIndex((tile) => tile.key === key);
  const tile = visible[index];
  if (tile === undefined || !tile.movable) return fromTiles(tiles, layout, widgets);

  if (sizeClass !== 'expanded') {
    const step = direction === 'left' || direction === 'up' ? -1 : 1;
    for (let at = index + step; at >= 0 && at < visible.length; at += step) {
      const other = visible[at]!;
      if (other.movable) return swapTiles(layout, widgets, grid, key, other.key);
    }
    return fromTiles(tiles, layout, widgets);
  }

  if (direction === 'left' || direction === 'right') {
    const x = tile.x + (direction === 'right' ? 1 : -1);
    if (x < 0 || x + tile.w > grid.expanded) return fromTiles(tiles, layout, widgets);
    return moveTile(layout, widgets, grid, key, { x, y: tile.y });
  }
  const other = neighbour(visible, tile, direction);
  if (other === undefined || !other.movable) return fromTiles(tiles, layout, widgets);
  /* Moving down is the widget below moving up into this place. */
  return direction === 'up'
    ? moveTile(layout, widgets, grid, key, { x: tile.x, y: other.y })
    : moveTile(layout, widgets, grid, other.key, { x: other.x, y: tile.y });
}

/** A place and a size, as a pointer pulls them from any side; held within the widget's limits. */
export function resizeTile(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  box: DashboardBox,
): DashboardLayout {
  return adjusted(layout, widgets, grid, (_, find) => {
    const current = find(key);
    const spec = widgets.find((widget) => widget.key === key);
    if (current === undefined || spec === undefined || spec.resizable === false) return null;
    const limits = limitsOf(spec, grid);
    const w = clamp(Math.round(box.w), limits.minColumns, limits.maxColumns);
    const h = clamp(Math.round(box.h), limits.minRows, limits.maxRows);
    /* A pull from the start edge that hit a limit keeps the end edge still. */
    const end = Math.round(box.x + box.w);
    const x = Math.round(box.x) === current.x ? current.x : end - w;
    current.w = w;
    current.h = h;
    current.x = clamp(x, 0, grid.expanded - w);
    current.y = Math.max(0, Math.round(box.y));
    return current;
  });
}

/**
 * One step by key, in the units of the class the widget is drawn in. In the
 * expanded class the end edge moves a column or a row, and a widget already at
 * the last column grows toward the start. In the medium class a widget steps
 * between a half and the whole. The compact class is one column as
 * tall as its content, so it has no size to step.
 */
export function resizeTileBy(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  delta: { readonly columns: number; readonly rows: number },
  sizeClass: DashboardSizeClass,
): DashboardLayout {
  const tiles = resolveTiles(layout, widgets, grid);
  const tile = tiles.find((each) => each.key === key && !each.hidden);
  if (tile === undefined || !tile.resizable || sizeClass === 'compact') {
    return fromTiles(tiles, layout, widgets);
  }
  let w: number;
  if (sizeClass === 'medium' && delta.columns !== 0) {
    const steps = [...new Set([mediumHalf(grid), grid.medium])];
    const at = steps.indexOf(tile.medium);
    const next = steps[clamp(at + Math.sign(delta.columns), 0, steps.length - 1)]!;
    w = expandedFromMedium(next, grid);
  } else {
    w = tile.w + delta.columns;
  }
  w = clamp(w, tile.minColumns, tile.maxColumns);
  const x = tile.x + w > grid.expanded ? grid.expanded - w : tile.x;
  return resizeTile(layout, widgets, grid, key, { x, y: tile.y, w, h: tile.h + delta.rows });
}

/**
 * A size a pointer reached, in the units of the class the widget is drawn in.
 * The expanded class takes the box as it is; the medium class snaps the width
 * to the nearer of a half and the whole, and keeps the widget's place
 * in the flow; the compact class has no size to pull.
 */
export function resizeTileInClass(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  box: DashboardBox,
  sizeClass: DashboardSizeClass,
): DashboardLayout {
  if (sizeClass === 'expanded') return resizeTile(layout, widgets, grid, key, box);
  const tiles = resolveTiles(layout, widgets, grid);
  const tile = tiles.find((each) => each.key === key && !each.hidden);
  if (tile === undefined || sizeClass === 'compact') return fromTiles(tiles, layout, widgets);
  const steps = [...new Set([mediumHalf(grid), grid.medium])];
  const nearest = steps.reduce((best, step) =>
    Math.abs(step - box.w) < Math.abs(best - box.w) ? step : best,
  );
  const w = clamp(expandedFromMedium(nearest, grid), tile.minColumns, tile.maxColumns);
  const x = tile.x + w > grid.expanded ? grid.expanded - w : tile.x;
  return resizeTile(layout, widgets, grid, key, { x, y: tile.y, w, h: box.h });
}

export function setTileHidden(
  layout: DashboardLayout,
  widgets: readonly DashboardWidgetSpec[],
  grid: DashboardColumns,
  key: string,
  hidden: boolean,
): DashboardLayout {
  const materialized = materializeLayout(layout, widgets, grid);
  const next = materialized.map((item) => {
    if (item.key !== key) return item;
    const spec = widgets.find((widget) => widget.key === key);
    if (hidden && spec?.removable === false) return item;
    const { hidden: _hidden, ...rest } = item;
    return hidden ? { ...rest, hidden: true } : rest;
  });
  return materializeLayout(next, widgets, grid);
}

/* ── Geometry ──────────────────────────────────────────────────────────── */

export interface GridBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

export interface GridGeometry {
  readonly columns: number;
  /** A row's height, in pixels. */
  readonly row: number;
  readonly gap: number;
}

/** The cell a point falls in, counted from the inline start. */
export function cellAt(
  point: { readonly x: number; readonly y: number },
  box: GridBox,
  geometry: GridGeometry,
  direction: 'ltr' | 'rtl',
): DashboardCell {
  const { columns, row, gap } = geometry;
  const track = (box.width - gap * (columns - 1)) / columns;
  const along = direction === 'rtl' ? box.left + box.width - point.x : point.x - box.left;
  const x = clamp(Math.floor(along / (track + gap)), 0, columns - 1);
  const y = Math.max(0, Math.floor((point.y - box.top) / (row + gap)));
  return { x, y };
}

/**
 * The whole number of tracks a pull leaves a widget at: its span's length
 * plus the travel, read in tracks of `track` pixels separated by `gap`. The
 * caller passes a travel already mirrored for a right-to-left document.
 */
export function spanFromTravel({
  span,
  track,
  gap,
  travel,
}: {
  readonly span: number;
  readonly track: number;
  readonly gap: number;
  readonly travel: number;
}): number {
  if (track + gap <= 0) return span;
  const length = span * track + (span - 1) * gap + travel;
  return Math.max(1, Math.round((length + gap) / (track + gap)));
}

export function layoutsEqual(a: DashboardLayout, b: DashboardLayout): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      item.key === other.key &&
      item.x === other.x &&
      item.y === other.y &&
      item.w === other.w &&
      item.h === other.h &&
      (item.hidden === true) === (other.hidden === true)
    );
  });
}

/* ── Text ──────────────────────────────────────────────────────────────── */

/** The version `serializeDashboardLayout` writes under `v`. */
export const DASHBOARD_LAYOUT_VERSION = 2;

/** One line a store keeps: `{"v":2,"items":[[key, x, y, w, h, hidden?]]}`. */
export function serializeDashboardLayout(layout: DashboardLayout): string {
  return JSON.stringify({
    v: DASHBOARD_LAYOUT_VERSION,
    items: layout.map((item) => {
      const row = [item.key, item.x, item.y, item.w, item.h];
      return item.hidden === true ? [...row, 1] : row;
    }),
  });
}

const isPlace = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;
const isSize = (value: unknown): value is number => isPlace(value) && value >= 1;

/**
 * Total: text that is not a layout of this version or a later one gives `null`,
 * so a bookmark or a stored entry degrades to the default layout rather than to
 * an error. An entry it cannot read is dropped and the rest are kept.
 */
export function parseDashboardLayout(text: string): DashboardLayout | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const { v, items } = data as { v?: unknown; items?: unknown };
  if (!isSize(v) || v < DASHBOARD_LAYOUT_VERSION || !Array.isArray(items)) return null;
  const layout: DashboardLayoutItem[] = [];
  for (const entry of items) {
    if (!Array.isArray(entry)) continue;
    const [key, x, y, w, h, hidden] = entry as unknown[];
    if (typeof key !== 'string' || key === '') continue;
    if (!isPlace(x) || !isPlace(y) || !isSize(w) || !isSize(h)) continue;
    layout.push(hidden === 1 ? { key, x, y, w, h, hidden: true } : { key, x, y, w, h });
  }
  return layout;
}
