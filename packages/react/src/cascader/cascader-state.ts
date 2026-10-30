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
import type { CascaderKeyAction, CascaderLayout, CascaderView } from '@slotted/core/cascader';
import { cascaderMessages, type CascaderMessages, type FamilyTranslator } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useLocale, useMessages } from '../i18n';

import type {
  CascaderDataProps,
  CascaderDefaults,
  CascaderStateProps,
  CascaderValue,
} from './cascader.types';

/**
 * A value whose request is refused, or whose consumer holds it, moves nothing
 * here; `createControllable` answers both questions in one call.
 */
function useControllable<V>(
  controlled: V | undefined,
  initial: V,
  onRequest: ((value: V, request: never) => void) | undefined,
  equals: (a: V, b: V) => boolean,
) {
  const [own, setOwn] = useState<V>(initial);
  const current = controlled === undefined ? own : controlled;
  const latest = useRef({ controlled, current, onRequest });
  latest.current = { controlled, current, onRequest };

  const set = useCallback(
    (next: V, reason: ChangeReason, source?: unknown) => {
      const state = latest.current;
      if (equals(next, state.current)) return false;
      const controllable = createControllable<V>({
        controlled: state.controlled,
        initial: state.current,
        equals: () => false,
        onRequest: (request) => state.onRequest?.(request.value, request as never),
      });
      if (!controllable.request(next, reason, source)) return state.controlled !== undefined;
      setOwn(next);
      return true;
    },
    // `equals` is a module-level function in every caller.
    [],
  );

  return [current, set] as const;
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);
const sameValue = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b) ? sameList(a, b) : a === b;
const sameScalar = (a: unknown, b: unknown) => a === b;

/** The keys a value names, in the order it names them. */
export function valueKeys(value: CascaderValue | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

export interface CascaderStateOptions<T> extends CascaderDataProps<T>, CascaderStateProps<T> {
  defaults: CascaderDefaults;
  /** Whether the surface is on show: a closed popup asks for no level. */
  showing: boolean;
  /** The room the surface may take, once measured. */
  available: number | undefined;
  columnMeasure: number;
  inset: number;
  closeOnSelect: boolean;
  /** Called when a single commit should close the popup. */
  onCommitted?: (() => void) | undefined;
}

export interface CascaderState<T> {
  baseId: string;
  collection: TreeCollection<T>;
  itemFor: (key: string) => T | undefined;
  /** The family's words in the language in force, with this instance's `messages` laid over them. */
  t: FamilyTranslator<CascaderMessages>;
  /** The locale the search compares and marks in: the `locale` prop, or the language in force. */
  locale: string;
  layout: CascaderLayout;
  multiple: boolean;
  disabled: boolean;
  readOnly: boolean;
  search: boolean;
  view: CascaderView;
  value: CascaderValue;
  emitted: readonly string[];
  path: readonly string[];
  activeKey: string | null;
  query: string;
  nodeId: (key: string) => string;
  setActive: (key: string | null, reason: ChangeReason, source?: unknown) => void;
  setQuery: (query: string, reason: ChangeReason, source?: unknown) => void;
  showLevel: (branch: string, reason: ChangeReason, source?: unknown) => void;
  goTo: (level: string | undefined, reason: ChangeReason, source?: unknown) => void;
  toggleExpanded: (key: string, reason: ChangeReason, source?: unknown) => void;
  choose: (
    key: string,
    reason: ChangeReason,
    source?: unknown,
    options?: { close?: boolean },
  ) => void;
  remove: (key: string, source?: unknown) => void;
  clear: (source?: unknown) => void;
  reveal: () => void;
  /** Runs a key; `true` when the family spent it. */
  handleKey: (
    event: { key: string; source?: unknown },
    dir: 'ltr' | 'rtl',
    open: boolean,
  ) => CascaderKeyAction | { type: 'handled' };
}

export function useCascaderState<T>(options: CascaderStateOptions<T>): CascaderState<T> {
  const { defaults, getKey, getLabel, getChildren, getParent, hasChildren, getChildrenCount } =
    options;
  const t = useMessages(cascaderMessages, options.messages);
  const inForce = useLocale();
  const locale = options.locale ?? inForce;
  const baseId = useId();

  const collection = useMemo(() => {
    const flat =
      getParent === undefined ? undefined : flatToTree(options.nodes, { getKey, getParent });
    return createTreeCollection<T>({
      roots: flat?.roots ?? options.nodes,
      getKey,
      getLabel,
      getChildren: flat?.getChildren ?? getChildren,
      hasChildren:
        hasChildren ?? ((node: T) => ((flat?.getChildren ?? getChildren)?.(node)?.length ?? 0) > 0),
      getChildrenCount,
      isDisabled: options.isNodeDisabled,
    });
  }, [
    getChildren,
    getChildrenCount,
    getKey,
    getLabel,
    getParent,
    hasChildren,
    options.isNodeDisabled,
    options.nodes,
  ]);

  const itemFor = useCallback((key: string) => collection.nodeFor(key)?.item, [collection]);

  const multiple = (options.selectionMode ?? defaults.selectionMode) === 'multiple';
  const selectable = options.selectable ?? defaults.selectable;
  const strategy = options.checkedStrategy ?? defaults.checkedStrategy;
  const disabled = options.disabled ?? defaults.disabled;
  const readOnly = options.readOnly ?? defaults.readOnly;
  const search = options.search ?? defaults.search;

  /**
   * Under a multiple selection every node that is not disabled has a box: a
   * branch's box toggles everything below it, and `checkedStrategy` decides
   * whether the branch or its leaves are emitted. `selectable` decides what a
   * single selection may commit.
   */
  const isSelectable = useCallback(
    (key: string) => {
      const node = collection.nodeFor(key);
      if (node === undefined || node.disabled) return false;
      if (multiple) return true;
      if (typeof selectable === 'function') return selectable(node.item);
      return selectable === 'any' || !node.hasChildren;
    },
    [collection, multiple, selectable],
  );

  const [value, setValue] = useControllable<CascaderValue>(
    options.value,
    options.defaultValue ?? (multiple ? [] : null),
    options.onValueChange as never,
    sameValue,
  );
  const [path, setPath] = useControllable<readonly string[]>(
    options.path,
    options.defaultPath ?? [],
    options.onPathChange as never,
    sameList,
  );
  const [activeKey, setActiveKey] = useControllable<string | null>(
    options.activeKey,
    options.defaultActiveKey ?? null,
    options.onActiveKeyChange as never,
    sameScalar,
  );
  const [expandedKeys, setExpandedKeys] = useControllable<readonly string[]>(
    options.expandedKeys,
    options.defaultExpandedKeys ?? [],
    options.onExpandedKeysChange as never,
    sameList,
  );
  const [ownQuery, setOwnQuery] = useControllable<string>(
    options.searchValue,
    options.defaultSearchValue ?? '',
    options.onSearchValueChange as never,
    sameScalar,
  );
  const query = search ? ownQuery : '';

  const emitted = valueKeys(value);
  const selected = useMemo(
    () => (multiple ? cascaderSelection(collection, emitted) : emitted),
    // The keys, not the array identity a controlled consumer rebuilds each render.
    [collection, multiple, emitted.join('\u0000')],
  );

  const layout = cascaderLayout({
    layout: options.layout ?? defaults.layout,
    available: options.available,
    columnMeasure: options.columnMeasure,
    inset: options.inset,
  });
  const fit = cascaderFit({
    available: options.available,
    columnMeasure: options.columnMeasure,
    inset: options.inset,
    maxColumns: options.maxColumns ?? defaults.maxColumns,
  });

  const filter = options.filter;
  const view = useMemo(
    () =>
      cascaderView({
        collection,
        layout,
        path,
        activeKey,
        expandedKeys,
        query,
        selected,
        selectionMode: multiple ? 'multiple' : 'single',
        isSelectable,
        isLoading: (key) => {
          const item = collection.nodeFor(key)?.item;
          return item !== undefined && (options.isNodeLoading?.(item) ?? false);
        },
        isFailed: (key) => {
          const item = collection.nodeFor(key)?.item;
          return item !== undefined && (options.isNodeFailed?.(item) ?? false);
        },
        fit,
        maxCrumbs: options.maxCrumbs ?? defaults.maxCrumbs,
        filter:
          filter === undefined
            ? undefined
            : (key, text) => {
                const item = collection.nodeFor(key)?.item;
                return item !== undefined && filter(item, text);
              },
        locale,
      }),
    [
      activeKey,
      collection,
      defaults.maxCrumbs,
      expandedKeys,
      filter,
      fit,
      isSelectable,
      layout,
      multiple,
      options.isNodeFailed,
      options.isNodeLoading,
      locale,
      options.maxCrumbs,
      path,
      query,
      selected,
    ],
  );

  const nodeId = useCallback((key: string) => `${baseId}node-${encodeURIComponent(key)}`, [baseId]);

  const latest = useRef({ options, view, selected, multiple, strategy, path, emitted, layout });
  latest.current = { options, view, selected, multiple, strategy, path, emitted, layout };

  const setActive = useCallback(
    (key: string | null, reason: ChangeReason, source?: unknown) => {
      setActiveKey(key, reason, source);
    },
    [setActiveKey],
  );

  const showLevel = useCallback(
    (branch: string, reason: ChangeReason, source?: unknown) => {
      setPath(pathTo(collection, branch), reason, source);
    },
    [collection, setPath],
  );

  const goTo = useCallback(
    (level: string | undefined, reason: ChangeReason, source?: unknown) => {
      /* A level is the branch whose children it lists. Going to it shows it as
         the deepest column, with the node the reader came from active in it. */
      const next = level === undefined ? [] : pathTo(collection, level);
      const from = latest.current.path[next.length];
      setPath(next, reason === 'pointer' ? 'pointer' : 'back', source);
      if (from !== undefined) setActiveKey(from, reason, source);
    },
    [collection, setActiveKey, setPath],
  );

  const toggleExpanded = useCallback(
    (key: string, reason: ChangeReason, source?: unknown) => {
      const held = latest.current.options.expandedKeys ?? expandedKeys;
      setExpandedKeys(
        held.includes(key) ? held.filter((candidate) => candidate !== key) : [...held, key],
        reason,
        source,
      );
    },
    [expandedKeys, setExpandedKeys],
  );

  const setQuery = useCallback(
    (next: string, reason: ChangeReason, source?: unknown) => {
      setOwnQuery(next, reason, source);
    },
    [setOwnQuery],
  );

  const choose = useCallback(
    (key: string, reason: ChangeReason, source?: unknown, choice: { close?: boolean } = {}) => {
      const state = latest.current;
      if (!isSelectable(key) || (state.options.readOnly ?? defaults.readOnly)) return;
      if (!state.multiple) {
        setValue(key, reason === 'keyboard' ? 'keyboard' : 'pointer', source);
        if (state.options.closeOnSelect && choice.close !== false) {
          state.options.onCommitted?.();
        }
        return;
      }
      const result = cascadeSelection({
        collection: collection as TreeCollection<unknown>,
        selected: state.selected,
        key,
        action: 'toggle',
      });
      if (!result.changed) return;
      setValue(
        cascaderValue({
          collection: collection as TreeCollection<unknown>,
          selected: result.selected,
          strategy: state.strategy,
        }),
        reason,
        source,
      );
    },
    [collection, defaults.readOnly, isSelectable, setValue],
  );

  const remove = useCallback(
    (key: string, source?: unknown) => {
      const state = latest.current;
      if (!state.multiple) {
        setValue(null, 'remove', source);
        return;
      }
      const result = cascadeSelection({
        collection: collection as TreeCollection<unknown>,
        selected: state.selected,
        key,
        action: 'deselect',
      });
      setValue(
        cascaderValue({
          collection: collection as TreeCollection<unknown>,
          selected: result.selected,
          strategy: state.strategy,
        }),
        'remove',
        source,
      );
    },
    [collection, setValue],
  );

  const clear = useCallback(
    (source?: unknown) => setValue(latest.current.multiple ? [] : null, 'clear', source),
    [setValue],
  );

  /** The level that holds the value on show, and the value active in it. */
  const reveal = useCallback(() => {
    const first = latest.current.emitted[0];
    if (first === undefined || collection.nodeFor(first) === undefined) {
      setActiveKey(collection.roots[0] ?? null, 'programmatic');
      return;
    }
    const trail = pathTo(collection, first);
    setPath(trail.slice(0, -1), 'programmatic');
    setExpandedKeys(trail.slice(0, -1), 'programmatic');
    setActiveKey(first, 'programmatic');
  }, [collection, setActiveKey, setExpandedKeys, setPath]);

  const handleKey = useCallback(
    (event: { key: string; source?: unknown }, dir: 'ltr' | 'rtl', open: boolean) => {
      const state = latest.current;
      const searching = state.view.searching;

      if (open && searching) {
        const results = state.view.results.map((node) => node.key);
        const index = activeKey === null ? -1 : results.indexOf(activeKey);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          const step = event.key === 'ArrowDown' ? 1 : -1;
          const next = results[Math.min(results.length - 1, Math.max(0, index + step))];
          if (next !== undefined) setActiveKey(next, 'keyboard', event.source);
          return { type: 'handled' as const };
        }
        if (event.key === 'Enter' && activeKey !== null) {
          if (isSelectable(activeKey)) {
            choose(activeKey, 'keyboard', event.source);
          } else if (collection.nodeFor(activeKey)?.hasChildren) {
            /* A branch found by name is a place to go: the query clears and
               its level opens, with its first child under the cursor. */
            setQuery('', 'select', event.source);
            showLevel(activeKey, 'keyboard', event.source);
            const first = collection.nodeFor(activeKey)?.children[0];
            if (first !== undefined) setActiveKey(first, 'keyboard', event.source);
          }
          return { type: 'handled' as const };
        }
        return { type: 'none' as const };
      }

      const action = cascaderKey({
        key: event.key,
        dir,
        layout: state.layout,
        open,
        active: activeKey ?? undefined,
        path: state.path,
        expandedKeys,
        collection: collection as TreeCollection<unknown>,
        selectionMode: state.multiple ? 'multiple' : 'single',
        isSelectable,
        search,
        hasQuery: query !== '',
      });

      switch (action.type) {
        case 'move':
          setActiveKey(action.key, 'keyboard', event.source);
          break;
        case 'enter':
          setPath(action.path, 'keyboard', event.source);
          if (action.key !== undefined) setActiveKey(action.key, 'keyboard', event.source);
          break;
        case 'back':
          setPath(action.path, 'back', event.source);
          setActiveKey(action.key, 'keyboard', event.source);
          break;
        case 'expand':
        case 'collapse':
          toggleExpanded(action.key, 'keyboard', event.source);
          break;
        case 'commit':
        case 'toggle':
          choose(action.key, 'keyboard', event.source);
          break;
        default:
          break;
      }
      return action;
    },
    [
      activeKey,
      choose,
      collection,
      expandedKeys,
      isSelectable,
      query,
      search,
      setActiveKey,
      setPath,
      setQuery,
      showLevel,
      toggleExpanded,
    ],
  );

  /**
   * A level on show that has not arrived asks for its children, once, with a
   * signal the family aborts when the path moves away or the surface closes.
   */
  const requested = useRef(new Map<string, AbortController>());
  const pendingKeys = options.showing
    ? view.columns
        .filter((column) => column.pending && !column.failed && column.parent !== undefined)
        .map((column) => column.parent as string)
        .concat(
          layout === 'tree'
            ? expandedKeys.filter((key) => {
                const node = collection.nodeFor(key);
                return node !== undefined && node.hasChildren && node.children.length === 0;
              })
            : [],
        )
    : [];
  const pendingSignature = pendingKeys.join('\u0000');

  useEffect(() => {
    const wanted = new Set(pendingSignature === '' ? [] : pendingSignature.split('\u0000'));
    for (const [key, controller] of requested.current) {
      if (wanted.has(key)) continue;
      controller.abort();
      requested.current.delete(key);
    }
    for (const key of wanted) {
      if (requested.current.has(key)) continue;
      const item = collection.nodeFor(key)?.item;
      if (item !== undefined && latest.current.options.isNodeLoading?.(item)) continue;
      const controller = new AbortController();
      requested.current.set(key, controller);
      latest.current.options.onLoadChildren?.({ key, signal: controller.signal });
    }
  }, [collection, pendingSignature]);

  useEffect(
    () => () => {
      for (const controller of requested.current.values()) controller.abort();
      requested.current.clear();
    },
    [],
  );

  /* The roots on their way: the first column waits as rows, and says so. */
  const shownView = useMemo(
    () =>
      options.loading === true && collection.roots.length === 0 && !view.searching
        ? {
            ...view,
            columns: [{ parent: undefined, level: 1, pending: true, failed: false, nodes: [] }],
          }
        : view,
    [collection.roots.length, options.loading, view],
  );

  return {
    baseId,
    collection,
    itemFor,
    t,
    locale,
    layout,
    multiple,
    disabled,
    readOnly,
    search,
    view: shownView,
    value,
    emitted,
    path,
    activeKey,
    query,
    nodeId,
    setActive,
    setQuery,
    showLevel,
    goTo,
    toggleExpanded,
    choose,
    remove,
    clear,
    reveal,
    handleKey,
  };
}
