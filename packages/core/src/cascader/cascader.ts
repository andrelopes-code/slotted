import { createFilter, matchRanges } from '../collection';
import type { FilterOptions, TreeCollection } from '../collection';
import type { HighlightRange } from '../highlight';

/**
 * The cascader's core: what a path shows, which layout a width allows, what a
 * key does in each layout, what a search finds and which keys a checked
 * strategy emits. Both bindings call these and hold no copy of the rules.
 *
 * Decisions.
 */

export type CascaderLayout = 'columns' | 'drill' | 'tree';
export type CascaderLayoutAxis = CascaderLayout | 'auto';

export interface CascaderLayoutInput {
  layout: CascaderLayoutAxis;
  /** The inline room the positioner reports, or `undefined` before it has measured. */
  available: number | undefined;
  /** One column's measure in pixels. */
  columnMeasure: number;
  /** The surface's own inline insets and borders, summed. */
  inset: number;
}

/**
 * `auto` shows columns while two of them fit and drills below that. It drills
 * until the popup has been measured, so a server render and the first client
 * render agree and the layout can only widen once, never narrow.
 */
export function cascaderLayout({
  layout,
  available,
  columnMeasure,
  inset,
}: CascaderLayoutInput): CascaderLayout {
  if (layout !== 'auto') return layout;
  if (available === undefined || available <= 0) return 'drill';
  return cascaderFit({ available, columnMeasure, inset, maxColumns: 2 }) >= 2 ? 'columns' : 'drill';
}

export interface CascaderFitInput {
  available: number | undefined;
  columnMeasure: number;
  inset: number;
  /** The most columns the consumer allows at once, whatever the room. */
  maxColumns: number;
}

/**
 * How many columns the popup shows at once: as many as the room holds, never
 * more than `maxColumns`, never fewer than one. The popup therefore has a
 * widest width it can reach, known as it opens, and the binding positions it
 * against that width — so a path that grows never pushes the layer back
 * across the screen under the pointer.
 */
export function cascaderFit({
  available,
  columnMeasure,
  inset,
  maxColumns,
}: CascaderFitInput): number {
  /* Nothing measured yet: a layout the consumer asked for by name shows what
     it asked for, and the window narrows once the room is known. `auto` never
     reaches here unmeasured, because it drills until then. */
  /* A width of zero is a surface not laid out yet — hidden, or measured
     before its first frame — and counts as nothing measured. */
  if (available === undefined || available <= 0 || columnMeasure <= 0) {
    return Math.max(1, Math.floor(maxColumns));
  }
  const room = Math.floor((available - inset) / columnMeasure);
  return Math.max(1, Math.min(Math.floor(maxColumns), room));
}

/** The keys from a root to `key`, root first; empty for a key the collection lacks. */
export function pathTo(collection: TreeCollection<unknown>, key: string): readonly string[] {
  if (collection.nodeFor(key) === undefined) return [];
  return [...collection.ancestorsOf(key), key];
}

export interface CascaderColumn {
  /** The branch whose children the column lists; `undefined` for the roots. */
  parent: string | undefined;
  keys: readonly string[];
  /** The depth of the keys it lists, from 1. */
  level: number;
  /** A branch whose children have not arrived: the column waits for them. */
  pending: boolean;
}

/**
 * One column for the roots and one for every branch on the path, in order.
 * The path is read only as far as it is a chain — each key a child of the one
 * before it — so a stale path shows what is still true of it rather than a
 * column for a key that moved.
 */
export function cascaderColumns(
  collection: TreeCollection<unknown>,
  path: readonly string[],
): readonly CascaderColumn[] {
  const columns: CascaderColumn[] = [
    { parent: undefined, keys: collection.roots, level: 1, pending: false },
  ];
  let siblings = collection.roots;

  for (const key of path) {
    if (!siblings.includes(key)) break;
    const node = collection.nodeFor(key);
    if (node === undefined || !node.hasChildren) break;
    columns.push({
      parent: key,
      keys: node.children,
      /* The collection counts depth from 0; a column states it from 1, as aria-level does. */
      level: node.level + 2,
      pending: node.children.length === 0,
    });
    siblings = node.children;
  }

  return columns;
}

export interface CascaderWindow {
  /** The levels further back than the window holds, root first: the breadcrumb lists them. */
  hidden: readonly CascaderColumn[];
  /** The levels on show, the deepest last. */
  visible: readonly CascaderColumn[];
}

/**
 * The columns on show: the deepest `fit` of them. A path deeper than the room
 * slides the window rather than widening the popup or scrolling it sideways,
 * and the levels it leaves behind go to the breadcrumb, one press away. The
 * window is derived from the path, so going back a level brings the column
 * before it into view without any state of its own.
 */
export function cascaderWindow(columns: readonly CascaderColumn[], fit: number): CascaderWindow {
  const count = Math.max(1, Math.floor(fit));
  const cut = Math.max(0, columns.length - count);
  return { hidden: columns.slice(0, cut), visible: columns.slice(cut) };
}

export type CascaderCrumb<K = string | undefined> =
  | { type: 'level'; key: K; current: boolean }
  /** The levels folded away in the middle; a press goes to the deepest of them. */
  | { type: 'collapsed'; keys: readonly K[]; target: K };

/**
 * The breadcrumb for a trail of levels, root first, the current one last. At
 * most `max` crumbs: the first, a fold for the middle, and the deepest ones.
 * A fold is one control, and pressing it goes up to the deepest level it
 * holds, so every hidden level stays reachable one level at a time.
 */
export function cascaderCrumbs<K>(trail: readonly K[], max = 4): readonly CascaderCrumb<K>[] {
  const last = trail.length - 1;
  const level = (key: K, index: number): CascaderCrumb<K> => ({
    type: 'level',
    key,
    current: index === last,
  });
  const limit = Math.max(3, Math.floor(max));
  if (trail.length <= limit) return trail.map(level);

  const tail = limit - 2;
  const folded = trail.slice(1, trail.length - tail);
  return [
    level(trail[0] as K, 0),
    { type: 'collapsed', keys: folded, target: folded[folded.length - 1] as K },
    ...trail
      .slice(trail.length - tail)
      .map((key, index) => level(key, trail.length - tail + index)),
  ];
}

export interface FlatToTreeOptions<T> {
  getKey: (item: T) => string;
  /** `null` and `undefined` both mean a root. */
  getParent: (item: T) => string | null | undefined;
}

export interface FlatTree<T> {
  roots: readonly T[];
  getChildren: (item: T) => readonly T[] | undefined;
}

/**
 * A flat list with a parent pointer, nested in one pass for
 * `createTreeCollection`. Rows may arrive in any order; a row whose parent is
 * unknown becomes a root rather than disappearing, and a repeated key keeps
 * its first row.
 */
export function flatToTree<T>(items: readonly T[], { getKey, getParent }: FlatToTreeOptions<T>) {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = getKey(item);
    if (!byKey.has(key)) byKey.set(key, item);
  }

  const children = new Map<string, T[]>();
  const roots: T[] = [];
  for (const [key, item] of byKey) {
    const parent = getParent(item);
    if (parent === null || parent === undefined || !byKey.has(parent) || parent === key) {
      roots.push(item);
      continue;
    }
    const list = children.get(parent);
    if (list === undefined) children.set(parent, [item]);
    else list.push(item);
  }

  return {
    roots,
    getChildren: (item: T) => children.get(getKey(item)),
  } satisfies FlatTree<T>;
}

export type CascaderKeyAction =
  | { type: 'none' }
  | { type: 'open'; entry: 'first' | 'last' }
  | { type: 'close' }
  | { type: 'clear-search' }
  | { type: 'move'; key: string }
  /** Show the level under `path`'s last key and move to `key`, its first child when it has one. */
  | { type: 'enter'; path: readonly string[]; key: string | undefined }
  /** Close the column the active node was in and move to its parent. */
  | { type: 'back'; path: readonly string[]; key: string }
  | { type: 'expand'; key: string }
  | { type: 'collapse'; key: string }
  | { type: 'commit'; key: string }
  | { type: 'toggle'; key: string };

export interface CascaderKeyInput {
  key: string;
  dir: 'ltr' | 'rtl';
  layout: CascaderLayout;
  open: boolean;
  active: string | undefined;
  path: readonly string[];
  expandedKeys: readonly string[];
  collection: TreeCollection<unknown>;
  selectionMode: 'single' | 'multiple';
  isSelectable: (key: string) => boolean;
  /** Whether a text field holds focus, which owns the caret keys and the characters. */
  search: boolean;
  hasQuery: boolean;
}

const NONE: CascaderKeyAction = { type: 'none' };

/**
 * The decision a key makes, for the three layouts. `columns` and `drill` keep
 * the vertical arrows inside the active column — the one departure from the
 * pattern's tree, written in the contract — and take a branch's level and its
 * first child in one step on the inline end.
 */
export function cascaderKey(input: CascaderKeyInput): CascaderKeyAction {
  const { key, dir, layout, open, active, collection, search } = input;

  if (!open) {
    if (key === 'ArrowDown') return { type: 'open', entry: 'first' };
    if (key === 'ArrowUp') return { type: 'open', entry: 'last' };
    return NONE;
  }

  if (key === 'Escape')
    return search && input.hasQuery ? { type: 'clear-search' } : { type: 'close' };
  if (active === undefined) return NONE;

  const node = collection.nodeFor(active);
  if (node === undefined) return NONE;

  const inlineEnd = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const inlineStart = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  const expanded = new Set(input.expandedKeys);
  const order =
    layout === 'tree'
      ? collection.visible(expanded).map((visible) => visible.key)
      : ((node.parent === undefined
          ? collection.roots
          : collection.nodeFor(node.parent)?.children) ?? []);
  const index = order.indexOf(active);

  switch (key) {
    case 'ArrowDown': {
      const next = order[index + 1];
      return next === undefined ? NONE : { type: 'move', key: next };
    }
    case 'ArrowUp': {
      const previous = index > 0 ? order[index - 1] : undefined;
      return previous === undefined ? NONE : { type: 'move', key: previous };
    }
    case 'Home':
    case 'End': {
      if (search) return NONE;
      const target = key === 'Home' ? order[0] : order[order.length - 1];
      return target === undefined || target === active ? NONE : { type: 'move', key: target };
    }
    case inlineEnd:
      return enter(input, node.key);
    case inlineStart:
      return back(input);
    case 'Enter':
    case ' ': {
      if (key === ' ' && search && input.selectionMode === 'single') return NONE;
      if (node.disabled) return NONE;
      if (input.isSelectable(active)) {
        return input.selectionMode === 'multiple'
          ? { type: 'toggle', key: active }
          : { type: 'commit', key: active };
      }
      return node.hasChildren ? enter(input, node.key) : NONE;
    }
    default:
      return NONE;
  }
}

function enter(input: CascaderKeyInput, branch: string): CascaderKeyAction {
  const { collection, layout } = input;
  const node = collection.nodeFor(branch);
  if (node === undefined || !node.hasChildren) return NONE;

  if (layout === 'tree') {
    if (!input.expandedKeys.includes(branch)) return { type: 'expand', key: branch };
    const first = node.children[0];
    return first === undefined ? NONE : { type: 'move', key: first };
  }

  return { type: 'enter', path: pathTo(collection, branch), key: node.children[0] };
}

function back(input: CascaderKeyInput): CascaderKeyAction {
  const { collection, layout, active } = input;
  if (active === undefined) return NONE;
  const node = collection.nodeFor(active);
  if (node === undefined) return NONE;

  if (layout === 'tree' && node.hasChildren && input.expandedKeys.includes(active)) {
    return { type: 'collapse', key: active };
  }
  if (node.parent === undefined) return NONE;
  if (layout === 'tree') return { type: 'move', key: node.parent };

  const parentPath = pathTo(collection, node.parent);
  return { type: 'back', path: parentPath.slice(0, -1), key: node.parent };
}

export interface CascaderSearchInput extends FilterOptions {
  collection: TreeCollection<unknown>;
  query: string;
  /** Replaces the locale-aware substring test on the label. */
  filter?: ((key: string, query: string) => boolean) | undefined;
}

export interface CascaderSearchResult {
  key: string;
  /** Root first, the hit last. */
  path: readonly string[];
  ranges: readonly HighlightRange[];
}

/**
 * Every loaded node whose label answers the query, at any depth, in the
 * collection's order, with its path and the spans to mark. The navigation
 * path is not touched: a search narrows what is shown and moves nothing.
 */
export function cascaderSearch({
  collection,
  query,
  filter,
  locale,
  sensitivity,
}: CascaderSearchInput): readonly CascaderSearchResult[] {
  if (query.trim() === '') return [];
  const options: FilterOptions = {
    ...(locale === undefined ? {} : { locale }),
    ...(sensitivity === undefined ? {} : { sensitivity }),
  };
  const test = createFilter(options);

  return collection.nodes
    .filter((node) => (filter ? filter(node.key, query) : test.contains(node.label, query)))
    .map((node) => ({
      key: node.key,
      path: pathTo(collection, node.key),
      ranges: matchRanges(node.label, query, options),
    }));
}

export type CascaderCheckedStrategy = 'all' | 'parent' | 'child';

export interface CascaderValueInput {
  collection: TreeCollection<unknown>;
  selected: readonly string[];
  strategy: CascaderCheckedStrategy;
}

/**
 * The keys a multiple selection emits. `all` emits every selected key;
 * `parent` a branch whose descendants are all selected stands for them;
 * `child` only the keys that have no children. A key the collection no longer
 * holds is kept under every strategy, as `cascadeSelection` keeps it.
 */
export function cascaderValue({
  collection,
  selected,
  strategy,
}: CascaderValueInput): readonly string[] {
  if (strategy === 'all') return selected;
  const chosen = new Set(selected);

  return selected.filter((key) => {
    const node = collection.nodeFor(key);
    if (node === undefined) return true;
    if (strategy === 'child') return !node.hasChildren;
    return collection.ancestorsOf(key).every((ancestor) => !chosen.has(ancestor));
  });
}

export interface CascaderNodeView {
  key: string;
  label: string;
  /** From 1, as `aria-level` states it. */
  level: number;
  /** From 0, what the tree layout indents by. */
  depth: number;
  posInSet: number;
  setSize: number;
  branch: boolean;
  /** On the open path, or open in place under the tree layout. */
  expanded: boolean;
  current: boolean;
  selected: boolean;
  indeterminate: boolean;
  disabled: boolean;
  selectable: boolean;
  loading: boolean;
  failed: boolean;
  /** The count the collection states, or the children it holds. */
  childrenCount: number | undefined;
  /** How many selected keys sit below it, for the meta of a branch. */
  selectedInside: number;
  /** A search hit's ancestors, root first, without the hit. */
  trail: readonly string[];
  ranges: readonly HighlightRange[];
}

export interface CascaderColumnView {
  parent: string | undefined;
  level: number;
  /** Waiting for children the consumer is loading. */
  pending: boolean;
  /** The consumer reported that the children could not be loaded. */
  failed: boolean;
  nodes: readonly CascaderNodeView[];
}

export interface CascaderViewInput {
  collection: TreeCollection<unknown>;
  layout: CascaderLayout;
  path: readonly string[];
  activeKey: string | null;
  expandedKeys: readonly string[];
  query: string;
  selected: readonly string[];
  selectionMode: 'single' | 'multiple';
  isSelectable: (key: string) => boolean;
  isLoading?: ((key: string) => boolean) | undefined;
  isFailed?: ((key: string) => boolean) | undefined;
  /** How many columns are on show at once (`cascaderFit`). */
  fit: number;
  maxCrumbs: number;
  filter?: ((key: string, query: string) => boolean) | undefined;
  locale?: string | undefined;
}

export interface CascaderView {
  searching: boolean;
  /** Root first; `undefined` is the root level. Empty when nothing is behind the columns. */
  crumbs: readonly CascaderCrumb[];
  columns: readonly CascaderColumnView[];
  results: readonly CascaderNodeView[];
}

/**
 * Everything a binding draws, from the state it holds: the columns on show
 * and their nodes, the breadcrumb, and the search results. A pure function of
 * its input, so the two bindings render the same picture from the same state
 * and the rules are tested once.
 */
export function cascaderView(input: CascaderViewInput): CascaderView {
  const { collection, layout, path, activeKey, query, selectionMode } = input;
  const selected = new Set(input.selected);
  const expandedSet = new Set(input.expandedKeys);
  const onPath = new Set(path);
  const partial =
    selectionMode === 'multiple'
      ? new Set(indeterminateOf(collection, input.selected))
      : new Set<string>();

  const view = (
    key: string,
    extra: Partial<Pick<CascaderNodeView, 'trail' | 'ranges'>> = {},
  ): CascaderNodeView => {
    const node = collection.nodeFor(key);
    const branch = node?.hasChildren ?? false;
    const inside = branch
      ? collection.descendantsOf(key).filter((child) => selected.has(child))
      : [];
    return {
      key,
      label: node?.label ?? key,
      level: (node?.level ?? 0) + 1,
      depth: node?.level ?? 0,
      posInSet: node?.posInSet ?? 1,
      setSize: node?.setSize ?? 1,
      branch,
      expanded: branch && (layout === 'tree' ? expandedSet.has(key) : onPath.has(key)),
      current: key === activeKey,
      selected: selected.has(key),
      indeterminate: partial.has(key),
      disabled: node?.disabled ?? false,
      selectable: input.isSelectable(key),
      loading: input.isLoading?.(key) ?? false,
      failed: input.isFailed?.(key) ?? false,
      childrenCount:
        node?.childrenCount ?? (branch && node ? node.children.length || undefined : undefined),
      selectedInside: inside.length,
      trail: extra.trail ?? [],
      ranges: extra.ranges ?? [],
    };
  };

  if (query.trim() !== '') {
    const results = cascaderSearch({
      collection,
      query,
      filter: input.filter,
      locale: input.locale,
    }).map((hit) => view(hit.key, { trail: hit.path.slice(0, -1), ranges: hit.ranges }));
    return { searching: true, crumbs: [], columns: [], results };
  }

  if (layout === 'tree') {
    const nodes = collection.visible(expandedSet).map((node) => view(node.key));
    return {
      searching: false,
      crumbs: [],
      columns: [{ parent: undefined, level: 1, pending: false, failed: false, nodes }],
      results: [],
    };
  }

  const columns = cascaderColumns(collection, path);
  const fit = layout === 'drill' ? 1 : input.fit;
  const { hidden, visible } = cascaderWindow(columns, fit);
  const columnView = (column: CascaderColumn): CascaderColumnView => ({
    parent: column.parent,
    level: column.level,
    pending: column.pending,
    failed: column.parent !== undefined && (input.isFailed?.(column.parent) ?? false),
    nodes: column.keys.map((key) => view(key)),
  });

  let crumbs: readonly CascaderCrumb[] = [];
  if (layout === 'drill') {
    crumbs =
      columns.length > 1
        ? cascaderCrumbs(
            columns.map((column) => column.parent),
            input.maxCrumbs,
          )
        : [];
  } else if (hidden.length > 0) {
    /* In columns the crumbs are the levels behind the window, every one of them
       a place to go back to: none of them is the current level. */
    crumbs = cascaderCrumbs(
      hidden.map((column) => column.parent),
      input.maxCrumbs,
    ).map((crumb) => (crumb.type === 'level' ? { ...crumb, current: false } : crumb));
  }

  return { searching: false, crumbs, columns: visible.map(columnView), results: [] };
}

function indeterminateOf(collection: TreeCollection<unknown>, selected: readonly string[]) {
  const chosen = new Set(selected);
  if (chosen.size === 0) return [];
  return collection.nodes
    .filter(
      (node) =>
        node.hasChildren &&
        !chosen.has(node.key) &&
        collection.descendantsOf(node.key).some((child) => chosen.has(child)),
    )
    .map((node) => node.key);
}

/**
 * The selection a value stands for, as the set every rendered state reads: a
 * key and everything below it, and a branch whose selectable children are all
 * in the set. A value written under `parent` or `child` comes back to the same
 * set, so the boxes draw the same whatever strategy emitted it.
 */
export function cascaderSelection(
  collection: TreeCollection<unknown>,
  keys: readonly string[],
): readonly string[] {
  const chosen = new Set<string>();
  for (const key of keys) {
    chosen.add(key);
    for (const child of collection.descendantsOf(key)) {
      if (!collection.isDisabled(child)) chosen.add(child);
    }
  }
  for (const branch of [...collection.nodes].reverse()) {
    if (!branch.hasChildren || branch.children.length === 0) continue;
    const enabled = branch.children.filter((child) => !collection.isDisabled(child));
    if (enabled.length > 0 && enabled.every((child) => chosen.has(child))) chosen.add(branch.key);
  }
  const inside = collection.keys.filter((key) => chosen.has(key));
  const outside = keys.filter((key) => collection.nodeFor(key) === undefined);
  return [...inside, ...outside];
}

export interface CascaderMeasure {
  /** One column's measure in pixels, resolved from the stylesheet. */
  columnMeasure: number;
  /** The surface's inline borders, summed. */
  inset: number;
}

/**
 * The column measure and the surface's inline edges, read from the rendered
 * surface: the measure is a length a theme states in any unit, so it is
 * resolved by laying a probe out at that length rather than by parsing it.
 */
export function cascaderMeasure(surface: HTMLElement): CascaderMeasure {
  const view = surface.ownerDocument.defaultView;
  const style = view?.getComputedStyle(surface);
  const length = style?.getPropertyValue('--_column-measure').trim() || '12rem';
  const probe = surface.ownerDocument.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;inline-size:${length};block-size:0`;
  surface.append(probe);
  const columnMeasure = probe.getBoundingClientRect().width || 192;
  probe.remove();
  const inset =
    (Number.parseFloat(style?.borderInlineStartWidth ?? '0') || 0) +
    (Number.parseFloat(style?.borderInlineEndWidth ?? '0') || 0);
  return { columnMeasure, inset };
}
