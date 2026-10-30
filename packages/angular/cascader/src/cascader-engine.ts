import { computed } from '@angular/core';
import type { ModelSignal, OutputEmitterRef, Signal } from '@angular/core';
import { cascadeSelection, createTreeCollection } from '@slotted/core/collection';
import type { TreeCollection } from '@slotted/core/collection';
import {
  cascaderFit,
  cascaderKey,
  cascaderLayout,
  cascaderSelection,
  cascaderValue,
  cascaderView,
  flatToTree,
  pathTo,
} from '@slotted/core/cascader';
import type {
  CascaderCheckedStrategy,
  CascaderKeyAction,
  CascaderLayout,
  CascaderLayoutAxis,
  CascaderView,
} from '@slotted/core/cascader';
import type { CascaderMessages, FamilyTranslator } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import type { CascaderValue } from './cascader-defaults';

/** What a level that has not arrived asks for, with the signal that withdraws it. */
export interface CascaderLoadRequest {
  readonly key: string;
  readonly signal: AbortSignal;
}

export type CascaderSelectable<T> = 'leaf' | 'any' | ((node: T) => boolean);

/** Space the surface measured. */
export interface CascaderRoom {
  available: number | undefined;
  columnMeasure: number;
  inset: number;
}

export interface CascaderEngineSource<T> {
  nodes: Signal<readonly T[]>;
  getKey: Signal<(node: T) => string>;
  getLabel: Signal<(node: T) => string>;
  getChildren: Signal<((node: T) => readonly T[] | undefined) | undefined>;
  getParent: Signal<((node: T) => string | null | undefined) | undefined>;
  hasChildren: Signal<((node: T) => boolean) | undefined>;
  getChildrenCount: Signal<((node: T) => number | undefined) | undefined>;
  isNodeDisabled: Signal<((node: T) => boolean) | undefined>;
  isNodeLoading: Signal<((node: T) => boolean) | undefined>;
  isNodeFailed: Signal<((node: T) => boolean) | undefined>;
  filter: Signal<((node: T, query: string) => boolean) | undefined>;
  locale: Signal<string | undefined>;
  loading: Signal<boolean>;
  multiple: Signal<boolean>;
  selectable: Signal<CascaderSelectable<T>>;
  checkedStrategy: Signal<CascaderCheckedStrategy>;
  layout: Signal<CascaderLayoutAxis>;
  search: Signal<boolean>;
  maxColumns: Signal<number>;
  maxCrumbs: Signal<number>;
  readOnly: Signal<boolean>;
  /** The family's words in the language in force. */
  t: FamilyTranslator<CascaderMessages>;
  room: Signal<CascaderRoom>;

  value: ModelSignal<CascaderValue>;
  path: ModelSignal<readonly string[]>;
  activeKey: ModelSignal<string | null>;
  expandedKeys: ModelSignal<readonly string[]>;
  searchValue: ModelSignal<string>;

  valueChangeRequest: OutputEmitterRef<ChangeRequest<CascaderValue>>;
  pathChangeRequest: OutputEmitterRef<ChangeRequest<readonly string[]>>;
  activeKeyChangeRequest: OutputEmitterRef<ChangeRequest<string | null>>;
  expandedKeysChangeRequest: OutputEmitterRef<ChangeRequest<readonly string[]>>;
  searchValueChangeRequest: OutputEmitterRef<ChangeRequest<string>>;
  loadChildren: OutputEmitterRef<CascaderLoadRequest>;
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);
const same = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b) ? sameList(a, b) : a === b;

/** The keys a value names, in the order it names them. */
export function valueKeys(value: CascaderValue | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

/**
 * The cascader's state, as signals, shared by the control and the panel. The
 * rules are `@slotted/core/cascader`'s; this class only holds the values, asks
 * before it moves one, and turns a key or a press into the request.
 */
export class CascaderEngine<T> {
  readonly collection: Signal<TreeCollection<T>>;
  readonly layout: Signal<CascaderLayout>;
  readonly fit: Signal<number>;
  readonly emitted: Signal<readonly string[]>;
  readonly view: Signal<CascaderView>;
  /** Called after a single commit that should close the popup. */
  onCommitted: (() => void) | undefined;
  closeOnSelect = false;

  private readonly selected: Signal<readonly string[]>;
  private readonly requested = new Map<string, AbortController>();

  constructor(private readonly source: CascaderEngineSource<T>) {
    this.collection = computed(() => {
      const nodes = source.nodes();
      const getKey = source.getKey();
      const getParent = source.getParent();
      const flat = getParent === undefined ? undefined : flatToTree(nodes, { getKey, getParent });
      const getChildren = flat?.getChildren ?? source.getChildren();
      return createTreeCollection<T>({
        roots: flat?.roots ?? nodes,
        getKey,
        getLabel: source.getLabel(),
        getChildren,
        hasChildren: source.hasChildren() ?? ((node: T) => (getChildren?.(node)?.length ?? 0) > 0),
        getChildrenCount: source.getChildrenCount(),
        isDisabled: source.isNodeDisabled(),
      });
    });

    this.layout = computed(() => {
      const room = source.room();
      return cascaderLayout({ layout: source.layout(), ...room });
    });
    this.fit = computed(() => cascaderFit({ ...source.room(), maxColumns: source.maxColumns() }));
    this.emitted = computed(() => valueKeys(source.value()));
    this.selected = computed(() =>
      source.multiple()
        ? cascaderSelection(this.collection() as TreeCollection<unknown>, this.emitted())
        : this.emitted(),
    );

    this.view = computed(() => {
      const collection = this.collection();
      const filter = source.filter();
      const isLoading = source.isNodeLoading();
      const isFailed = source.isNodeFailed();
      const item = (key: string) => collection.nodeFor(key)?.item;
      const view = cascaderView({
        collection: collection as TreeCollection<unknown>,
        layout: this.layout(),
        path: source.path(),
        activeKey: source.activeKey(),
        expandedKeys: source.expandedKeys(),
        query: source.search() ? source.searchValue() : '',
        selected: this.selected(),
        selectionMode: source.multiple() ? 'multiple' : 'single',
        isSelectable: (key) => this.isSelectable(key),
        isLoading: (key) => {
          const node = item(key);
          return node !== undefined && (isLoading?.(node) ?? false);
        },
        isFailed: (key) => {
          const node = item(key);
          return node !== undefined && (isFailed?.(node) ?? false);
        },
        fit: this.fit(),
        maxCrumbs: source.maxCrumbs(),
        filter:
          filter === undefined
            ? undefined
            : (key, query) => {
                const node = item(key);
                return node !== undefined && filter(node, query);
              },
        locale: source.locale(),
      });
      if (source.loading() && collection.roots.length === 0 && !view.searching) {
        return {
          ...view,
          columns: [{ parent: undefined, level: 1, pending: true, failed: false, nodes: [] }],
        };
      }
      return view;
    });
  }

  get query(): string {
    return this.source.search() ? this.source.searchValue() : '';
  }

  get multiple(): boolean {
    return this.source.multiple();
  }

  /** The family's words in the language in force, read by the surface. */
  get t(): FamilyTranslator<CascaderMessages> {
    return this.source.t;
  }

  get activeKey(): string | null {
    return this.source.activeKey();
  }

  itemFor(key: string): T | undefined {
    return this.collection().nodeFor(key)?.item;
  }

  labelOf(key: string | undefined): string {
    if (key === undefined) return this.source.t('root');
    return this.collection().nodeFor(key)?.label ?? key;
  }

  /**
   * Under a multiple selection every node that is not disabled has a box: a
   * branch's box toggles everything below it. `selectable` decides what a
   * single selection may commit.
   */
  isSelectable(key: string): boolean {
    const node = this.collection().nodeFor(key);
    if (node === undefined || node.disabled) return false;
    if (this.source.multiple()) return true;
    const selectable = this.source.selectable();
    if (typeof selectable === 'function') return selectable(node.item);
    return selectable === 'any' || !node.hasChildren;
  }

  private request<V>(
    model: ModelSignal<V>,
    output: OutputEmitterRef<ChangeRequest<V>>,
    next: V,
    reason: ChangeReason,
    source?: unknown,
  ): boolean {
    if (same(next, model())) return false;
    const controllable = createControllable<V>({
      initial: model(),
      equals: () => false,
      onRequest: (request) => output.emit(request),
    });
    if (!controllable.request(next, reason, source)) return false;
    model.set(next);
    return true;
  }

  setActive(key: string | null, reason: ChangeReason, source?: unknown) {
    this.request(this.source.activeKey, this.source.activeKeyChangeRequest, key, reason, source);
  }

  setPath(path: readonly string[], reason: ChangeReason, source?: unknown) {
    this.request(this.source.path, this.source.pathChangeRequest, path, reason, source);
  }

  setQuery(query: string, reason: ChangeReason, source?: unknown) {
    this.request(
      this.source.searchValue,
      this.source.searchValueChangeRequest,
      query,
      reason,
      source,
    );
  }

  setValue(value: CascaderValue, reason: ChangeReason, source?: unknown): boolean {
    return this.request(this.source.value, this.source.valueChangeRequest, value, reason, source);
  }

  showLevel(branch: string, reason: ChangeReason, source?: unknown) {
    this.setPath(pathTo(this.collection() as TreeCollection<unknown>, branch), reason, source);
  }

  goTo(level: string | undefined, reason: ChangeReason, source?: unknown) {
    const next =
      level === undefined ? [] : pathTo(this.collection() as TreeCollection<unknown>, level);
    const from = this.source.path()[next.length];
    this.setPath(next, reason === 'pointer' ? 'pointer' : 'back', source);
    if (from !== undefined) this.setActive(from, reason, source);
  }

  toggleExpanded(key: string, reason: ChangeReason, source?: unknown) {
    const held = this.source.expandedKeys();
    this.request(
      this.source.expandedKeys,
      this.source.expandedKeysChangeRequest,
      held.includes(key) ? held.filter((candidate) => candidate !== key) : [...held, key],
      reason,
      source,
    );
  }

  choose(key: string, reason: ChangeReason, source?: unknown, options: { close?: boolean } = {}) {
    if (!this.isSelectable(key) || this.source.readOnly()) return;
    const collection = this.collection() as TreeCollection<unknown>;
    if (!this.source.multiple()) {
      const moved = this.setValue(key, reason === 'keyboard' ? 'keyboard' : 'pointer', source);
      if ((moved || this.source.value() === key) && this.closeOnSelect && options.close !== false) {
        this.onCommitted?.();
      }
      return;
    }
    const result = cascadeSelection({
      collection,
      selected: this.selected(),
      key,
      action: 'toggle',
    });
    if (!result.changed) return;
    this.setValue(
      cascaderValue({
        collection,
        selected: result.selected,
        strategy: this.source.checkedStrategy(),
      }),
      reason,
      source,
    );
  }

  remove(key: string, source?: unknown) {
    if (!this.source.multiple()) {
      this.setValue(null, 'remove', source);
      return;
    }
    const collection = this.collection() as TreeCollection<unknown>;
    const result = cascadeSelection({
      collection,
      selected: this.selected(),
      key,
      action: 'deselect',
    });
    this.setValue(
      cascaderValue({
        collection,
        selected: result.selected,
        strategy: this.source.checkedStrategy(),
      }),
      'remove',
      source,
    );
  }

  clear(source?: unknown) {
    this.setValue(this.source.multiple() ? [] : null, 'clear', source);
  }

  /** The level that holds the value on show, and the value active in it. */
  reveal() {
    const collection = this.collection() as TreeCollection<unknown>;
    const first = this.emitted()[0];
    if (first === undefined || collection.nodeFor(first) === undefined) {
      if (this.source.activeKey() === null) {
        this.setActive(collection.roots[0] ?? null, 'programmatic');
      }
      return;
    }
    const trail = pathTo(collection, first);
    this.setPath(trail.slice(0, -1), 'programmatic');
    this.request(
      this.source.expandedKeys,
      this.source.expandedKeysChangeRequest,
      trail.slice(0, -1),
      'programmatic',
    );
    this.setActive(first, 'programmatic');
  }

  /** Runs a key; the action the core decided, or `handled` for a search key. */
  handleKey(
    key: string,
    source: unknown,
    dir: 'ltr' | 'rtl',
    open: boolean,
  ): CascaderKeyAction | { type: 'handled' } {
    const collection = this.collection() as TreeCollection<unknown>;
    const view = this.view();
    const active = this.source.activeKey();

    if (open && view.searching) {
      const results = view.results.map((node) => node.key);
      const index = active === null ? -1 : results.indexOf(active);
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        const next =
          results[
            Math.min(results.length - 1, Math.max(0, index + (key === 'ArrowDown' ? 1 : -1)))
          ];
        if (next !== undefined) this.setActive(next, 'keyboard', source);
        return { type: 'handled' };
      }
      if (key === 'Enter' && active !== null) {
        if (this.isSelectable(active)) this.choose(active, 'keyboard', source);
        else if (collection.nodeFor(active)?.hasChildren) {
          this.setQuery('', 'select', source);
          this.showLevel(active, 'keyboard', source);
          const first = collection.nodeFor(active)?.children[0];
          if (first !== undefined) this.setActive(first, 'keyboard', source);
        }
        return { type: 'handled' };
      }
      return { type: 'none' };
    }

    const action = cascaderKey({
      key,
      dir,
      layout: this.layout(),
      open,
      active: active ?? undefined,
      path: this.source.path(),
      expandedKeys: this.source.expandedKeys(),
      collection,
      selectionMode: this.source.multiple() ? 'multiple' : 'single',
      isSelectable: (candidate) => this.isSelectable(candidate),
      search: this.source.search(),
      hasQuery: this.query !== '',
    });

    switch (action.type) {
      case 'move':
        this.setActive(action.key, 'keyboard', source);
        break;
      case 'enter':
        this.setPath(action.path, 'keyboard', source);
        if (action.key !== undefined) this.setActive(action.key, 'keyboard', source);
        break;
      case 'back':
        this.setPath(action.path, 'back', source);
        this.setActive(action.key, 'keyboard', source);
        break;
      case 'expand':
      case 'collapse':
        this.toggleExpanded(action.key, 'keyboard', source);
        break;
      case 'commit':
      case 'toggle':
        this.choose(action.key, 'keyboard', source);
        break;
      default:
        break;
    }
    return action;
  }

  /**
   * A level on show that has not arrived asks for its children, once, with a
   * signal aborted when the path moves away or the surface closes. Called from
   * the host's effect with whether the surface is on show.
   */
  syncLoads(showing: boolean) {
    const view = this.view();
    const collection = this.collection();
    const wanted = new Set<string>();
    if (showing) {
      for (const column of view.columns) {
        if (column.pending && !column.failed && column.parent !== undefined)
          wanted.add(column.parent);
      }
      if (this.layout() === 'tree') {
        for (const key of this.source.expandedKeys()) {
          const node = collection.nodeFor(key);
          if (node !== undefined && node.hasChildren && node.children.length === 0) wanted.add(key);
        }
      }
    }
    for (const [key, controller] of this.requested) {
      if (wanted.has(key)) continue;
      controller.abort();
      this.requested.delete(key);
    }
    const isLoading = this.source.isNodeLoading();
    for (const key of wanted) {
      if (this.requested.has(key)) continue;
      const item = collection.nodeFor(key)?.item;
      if (item !== undefined && isLoading?.(item)) continue;
      const controller = new AbortController();
      this.requested.set(key, controller);
      this.source.loadChildren.emit({ key, signal: controller.signal });
    }
  }

  destroy() {
    for (const controller of this.requested.values()) controller.abort();
    this.requested.clear();
  }
}
