import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/tree/tree.css';
import '@slotted/styles/highlight/highlight.css';

import {
  cascadeSelection,
  createFilter,
  createTreeCollection,
  indeterminateKeys,
  moveIndex,
  nextSelection,
  splitByMatch,
  virtualWindow,
} from '@slotted/core/collection';
import type {
  MoveIntent,
  TreeCollection,
  TreeNode as TreeNodeData,
} from '@slotted/core/collection';
import { createControllable } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { TreeContext, TreeDepthContext } from './tree-context';
import { useTreeDefaults } from './tree-defaults';
import { NODE_SELECTOR, TreeNode } from './tree-parts';
import type {
  TreeActiveReason,
  TreeAlignment,
  TreeChangeRequest,
  TreeContextValue,
  TreeExpansionReason,
  TreeHandle,
  TreeProps,
  TreeRootProps,
  TreeSelectionIndicator,
  TreeSelectionReason,
  TreeStructure,
  TreeValue,
} from './tree.types';

/** One visible row, as the DOM reports it at the moment a key was pressed. */
interface Row {
  key: string;
  depth: number;
  branch: boolean;
  disabled: boolean;
  label: string;
  element: HTMLElement;
}

function toKeys(value: TreeValue | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

function same(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * A node the tree holds, and the selection, expansion and position a reader
 * moves through it.
 *
 * ── Where the visible list comes from ───────────────────────────────────
 *
 * From the DOM, in document order, which is the flattening a tree would
 * otherwise have to keep in step with the expanded set. A collapsed branch
 * renders no group and therefore contributes no rows, so what the keyboard
 * counts and what the reader sees cannot disagree. `listbox` and `menu` read
 * their collections the same way and for the same reason.
 *
 * `nodes` is a second thing and not a replacement: it is the hierarchy the tree
 * holds, and it answers the three questions the DOM cannot — what is under a
 * branch that is closed, which is what a cascade needs; what every branch is,
 * which is what `expandAll` opens; and what matches a query, which is what the
 * filter keeps the ancestors of.
 */
export function Tree<T = unknown>({
  activeKey,
  children,
  defaultActiveKey,
  defaultExpandedKeys,
  defaultValue,
  disabled,
  disallowEmptySelection,
  disallowSelectAll,
  emptyContent,
  expandOn,
  expandedKeys,
  focusMode,
  getChildren,
  getChildrenCount,
  getKey,
  getLabel,
  getLevel,
  guides,
  handleRef,
  hasChildren,
  invalid,
  isNodeDisabled,
  isNodeLoading,
  itemSize,
  loading,
  loop,
  name,
  navigateDisabled,
  nodes,
  onActiveKeyChange,
  onExpandedKeysChange,
  onNodeActivate,
  onValueChange,
  overscan,
  pageSize,
  query,
  readOnly,
  ref,
  render,
  renderNode,
  required,
  selectOnFocus,
  selectionBehavior,
  selectionCascade,
  selectionIndicator,
  selectionMode,
  size,
  structure,
  typeahead,
  typeaheadTimeout,
  value,
  variant,
  virtual,
  ...nativeProps
}: TreeProps<T>) {
  const defaults = useTreeDefaults();
  const resolved = {
    disabled: disabled ?? defaults.disabled,
    disallowEmptySelection: disallowEmptySelection ?? defaults.disallowEmptySelection,
    disallowSelectAll: disallowSelectAll ?? defaults.disallowSelectAll,
    expandOn: expandOn ?? defaults.expandOn,
    focusMode: focusMode ?? defaults.focusMode,
    guides: guides ?? defaults.guides,
    itemSize: itemSize ?? defaults.itemSize,
    loop: loop ?? defaults.loop,
    navigateDisabled: navigateDisabled ?? defaults.navigateDisabled,
    overscan: overscan ?? defaults.overscan,
    pageSize: pageSize ?? defaults.pageSize,
    selectOnFocus: selectOnFocus ?? defaults.selectOnFocus,
    selectionBehavior: selectionBehavior ?? defaults.selectionBehavior,
    selectionCascade: selectionCascade ?? defaults.selectionCascade,
    selectionIndicator: selectionIndicator ?? defaults.selectionIndicator,
    selectionMode: selectionMode ?? defaults.selectionMode,
    size: size ?? defaults.size,
    structure: structure ?? defaults.structure,
    typeahead: typeahead ?? defaults.typeahead,
    typeaheadTimeout: typeaheadTimeout ?? defaults.typeaheadTimeout,
    variant: variant ?? defaults.variant,
    virtual: virtual ?? defaults.virtual,
  };

  /**
   * `auto` reads the mode beside it: a box for a set the reader ticks, a
   * highlight for the one thing they chose, and neither when nothing is
   * selectable. The pattern's own note recommends exactly this convention.
   */
  const indicator: Exclude<TreeSelectionIndicator, 'auto'> =
    resolved.selectionIndicator !== 'auto'
      ? resolved.selectionIndicator
      : resolved.selectionMode === 'multiple'
        ? 'checkbox'
        : resolved.selectionMode === 'single'
          ? 'highlight'
          : 'none';

  /**
   * The flat structure is the windowed one, and it is the data-driven shape's
   * alone: a slice of rows cannot preserve nesting, and a `Tree.Node` written
   * by hand cannot render its children as its own siblings. A tree written with
   * children is nested whatever the axis says, and says so in the DOM.
   */
  const resolvedStructure: Exclude<TreeStructure, 'auto'> =
    nodes === undefined
      ? 'nested'
      : resolved.structure === 'auto'
        ? resolved.virtual
          ? 'flat'
          : 'nested'
        : resolved.structure;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLUListElement | null>(null);
  const baseId = useId();

  /* ── The hierarchy, when the tree was handed one ─────────────────────── */

  const collection: TreeCollection<T> | undefined = useMemo(() => {
    if (nodes === undefined || getKey === undefined) return undefined;
    return createTreeCollection<T>({
      ...(getLevel === undefined ? { roots: nodes } : { items: nodes }),
      getKey,
      ...(getLabel === undefined ? {} : { getLabel }),
      ...(getChildren === undefined ? {} : { getChildren }),
      ...(getLevel === undefined ? {} : { getLevel }),
      ...(hasChildren === undefined ? {} : { hasChildren }),
      ...(getChildrenCount === undefined ? {} : { getChildrenCount }),
      ...(isNodeDisabled === undefined ? {} : { isDisabled: isNodeDisabled }),
    });
  }, [
    getChildren,
    getChildrenCount,
    getKey,
    getLabel,
    getLevel,
    hasChildren,
    isNodeDisabled,
    nodes,
  ]);

  /* ── State ──────────────────────────────────────────────────────────── */

  const [ownKeys, setOwnKeys] = useState<readonly string[]>(() => toKeys(defaultValue));
  const controlled = value !== undefined;
  const selected = controlled ? toKeys(value) : ownKeys;

  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>(defaultExpandedKeys ?? []);
  const expansionControlled = expandedKeys !== undefined;
  const expanded = expansionControlled ? (expandedKeys ?? []) : ownExpanded;

  const [ownActive, setOwnActive] = useState<string | null>(defaultActiveKey ?? null);
  const activeControlled = activeKey !== undefined;
  const active = activeControlled ? (activeKey ?? null) : ownActive;

  const outward = useCallback(
    (keys: readonly string[]): TreeValue =>
      resolved.selectionMode === 'multiple' ? keys : (keys[0] ?? null),
    [resolved.selectionMode],
  );

  const requestSelection = useCallback(
    (keys: readonly string[], reason: TreeSelectionReason, source: unknown) => {
      let cancelled = false;
      const state = createControllable<readonly string[]>({
        ...(controlled ? { controlled: selected } : {}),
        initial: selected,
        equals: same,
        onRequest: (request) => {
          /* The request the consumer sees carries the shape the consumer gave:
             one key in single selection, the set in multiple. */
          const outwardRequest: TreeChangeRequest = {
            value: outward(request.value),
            previous: outward(request.previous),
            reason: request.reason,
            source: request.source,
            get cancelled() {
              return request.cancelled;
            },
            cancel: () => request.cancel(),
          };
          onValueChange?.(outwardRequest.value, outwardRequest);
          cancelled = request.cancelled;
        },
      });
      const moved = state.request(keys, reason, source);
      if (cancelled) return;
      if (moved) setOwnKeys(keys);
    },
    [controlled, onValueChange, outward, selected],
  );

  const requestExpanded = useCallback(
    (keys: readonly string[], reason: TreeExpansionReason, source: unknown) => {
      let cancelled = false;
      const state = createControllable<readonly string[]>({
        ...(expansionControlled ? { controlled: expanded } : {}),
        initial: expanded,
        equals: same,
        onRequest: (request) => {
          onExpandedKeysChange?.(request.value, request);
          cancelled = request.cancelled;
        },
      });
      const moved = state.request(keys, reason, source);
      if (cancelled) return;
      if (moved) setOwnExpanded(keys);
    },
    [expanded, expansionControlled, onExpandedKeysChange],
  );

  const requestActive = useCallback(
    (key: string | null, reason: TreeActiveReason, source: unknown) => {
      let cancelled = false;
      const state = createControllable<string | null>({
        ...(activeControlled ? { controlled: activeKey ?? null } : {}),
        initial: active,
        onRequest: (request) => {
          onActiveKeyChange?.(request.value, request);
          cancelled = request.cancelled;
        },
      });
      const moved = state.request(key, reason, source);
      if (cancelled) return;
      if (moved) setOwnActive(key);
    },
    [active, activeControlled, activeKey, onActiveKeyChange],
  );

  /* ── The visible rows, read from the DOM ─────────────────────────────── */

  const readRows = useCallback((): Row[] => {
    const canvas = canvasRef.current;
    if (canvas === null) return [];
    return [...canvas.querySelectorAll<HTMLElement>(NODE_SELECTOR)].map((element) => ({
      key: element.dataset['key'] ?? '',
      depth: Number(element.dataset['depth'] ?? 0),
      branch: element.dataset['branch'] !== undefined,
      disabled: element.getAttribute('aria-disabled') === 'true',
      label:
        element.dataset['textValue'] ??
        element.querySelector("[data-part='label']")?.textContent?.trim() ??
        '',
      element,
    }));
  }, []);

  /** The index of the row a key acts on, or `-1` when the keyboard is nowhere. */
  const indexOfActive = (rows: readonly Row[]) => rows.findIndex((row) => row.key === active);

  /** The nearest row above `index` that sits one level up. */
  const parentOf = (rows: readonly Row[], index: number) => {
    const depth = rows[index]?.depth ?? 0;
    for (let step = index - 1; step >= 0; step -= 1) {
      const row = rows[step] as Row;
      if (row.depth < depth) return step;
    }
    return -1;
  };

  /** Every rendered row under `index`, which is every descendant on screen. */
  const renderedDescendants = (rows: readonly Row[], index: number) => {
    const depth = rows[index]?.depth ?? 0;
    const held: string[] = [];
    for (let step = index + 1; step < rows.length; step += 1) {
      const row = rows[step] as Row;
      if (row.depth <= depth) break;
      held.push(row.key);
    }
    return held;
  };

  /* ── The filter ─────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    if (collection === undefined || query === undefined || query.trim() === '') return undefined;
    const filter = createFilter();
    const hits = new Set<string>();
    for (const node of collection.nodes) {
      if (filter.contains(node.label, query)) hits.add(node.key);
    }
    const kept = new Set(hits);
    for (const key of hits) for (const ancestor of collection.ancestorsOf(key)) kept.add(ancestor);
    return { hits, kept };
  }, [collection, query]);

  /* ── Selection ──────────────────────────────────────────────────────── */

  const cascading = resolved.selectionCascade === 'descendants';

  const indeterminate = useMemo(() => {
    if (!cascading) return new Set<string>();
    if (collection !== undefined) return new Set(indeterminateKeys(collection, selected));
    return new Set<string>();
  }, [cascading, collection, selected]);

  const chosen = useMemo(() => new Set(selected), [selected]);

  const isOpen = useCallback(
    (key: string) =>
      expanded.includes(key) ||
      (filtered !== undefined && filtered.kept.has(key) && !filtered.hits.has(key)),
    [expanded, filtered],
  );

  const holdsSelection = useCallback(
    (key: string) => {
      if (collection === undefined || chosen.has(key)) return false;
      return collection.descendantsOf(key).some((child) => chosen.has(child));
    },
    [chosen, collection],
  );

  /** Where the next range starts: the node the last plain press settled on. */
  const anchorRef = useRef<string | undefined>(undefined);

  const applySelection = useCallback(
    (
      key: string,
      event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | undefined,
      intent: 'toggle' | 'replace' | 'range' | 'all' | 'clear',
      reason: TreeSelectionReason,
    ) => {
      if (resolved.selectionMode === 'none' || readOnly === true) return;
      const rows = readRows();

      if (cascading && collection !== undefined && (intent === 'toggle' || intent === 'replace')) {
        const result = cascadeSelection({
          collection,
          selected,
          key,
          action: 'toggle',
        });
        if (result.changed) requestSelection(result.selected, reason, event);
        return;
      }

      const keys = rows.filter((row) => !row.disabled).map((row) => row.key);
      const result = nextSelection({
        action: intent,
        mode: resolved.selectionMode,
        behavior: resolved.selectionBehavior,
        selected,
        keys,
        key,
        anchor: anchorRef.current ?? key,
        disabled: (candidate) => rows.find((row) => row.key === candidate)?.disabled === true,
        disallowEmpty: resolved.disallowEmptySelection,
        disallowSelectAll: resolved.disallowSelectAll,
      });
      anchorRef.current = result.anchor;
      if (result.changed) requestSelection(result.selected, reason, event);
    },
    [
      cascading,
      collection,
      readOnly,
      readRows,
      requestSelection,
      resolved.disallowEmptySelection,
      resolved.disallowSelectAll,
      resolved.selectionBehavior,
      resolved.selectionMode,
      selected,
    ],
  );

  /* ── Expansion ──────────────────────────────────────────────────────── */

  const setExpanded = useCallback(
    (key: string, open: boolean, reason: TreeExpansionReason, source: unknown) => {
      const holds = expanded.includes(key);
      if (holds === open) return;
      const next = open ? [...expanded, key] : expanded.filter((candidate) => candidate !== key);

      /**
       * Closing a branch that holds the active node moves the active node to
       * the branch, and that request goes out first: a consumer that accepts
       * one and refuses the other is left with a coherent pair, where the
       * reverse order would strand the keyboard on an element the next render
       * removes.
       */
      if (!open && active !== null && active !== key) {
        const rows = readRows();
        const index = rows.findIndex((row) => row.key === key);
        if (index !== -1 && renderedDescendants(rows, index).includes(active)) {
          requestActive(key, reason === 'pointer' ? 'pointer' : 'keyboard', source);
        }
      }
      requestExpanded(next, reason, source);
    },
    [active, expanded, readRows, requestActive, requestExpanded],
  );

  /* ── The pointer ────────────────────────────────────────────────────── */

  const press = useCallback(
    (key: string, event: MouseEvent<HTMLElement>) => {
      if (resolved.disabled === true) return;
      const rows = readRows();
      const row = rows.find((candidate) => candidate.key === key);
      if (row === undefined || row.disabled) return;

      requestActive(key, 'pointer', event);

      if (row.branch && resolved.expandOn === 'row') {
        setExpanded(key, !expanded.includes(key), 'pointer', event);
      }

      if (resolved.selectionMode !== 'none') {
        const intent = event.shiftKey
          ? 'range'
          : event.ctrlKey || event.metaKey
            ? 'toggle'
            : resolved.selectionBehavior === 'replace'
              ? 'replace'
              : 'toggle';
        applySelection(key, event, intent, 'pointer');
      }

      onNodeActivate?.(key, 'pointer');
    },
    [
      applySelection,
      expanded,
      onNodeActivate,
      readRows,
      requestActive,
      resolved.disabled,
      resolved.expandOn,
      resolved.selectionBehavior,
      resolved.selectionMode,
      setExpanded,
    ],
  );

  const pressExpander = useCallback(
    (key: string, event: MouseEvent<HTMLElement>) => {
      if (resolved.disabled === true) return;
      requestActive(key, 'pointer', event);
      setExpanded(key, !expanded.includes(key), 'pointer', event);
    },
    [expanded, requestActive, resolved.disabled, setExpanded],
  );

  const pressIndicator = useCallback(
    (key: string, event: MouseEvent<HTMLElement>) => {
      if (resolved.disabled === true) return;
      requestActive(key, 'pointer', event);
      applySelection(key, event, 'toggle', 'pointer');
    },
    [applySelection, requestActive, resolved.disabled],
  );

  /* ── The keyboard ───────────────────────────────────────────────────── */

  const typeaheadRef = useRef<TypeaheadHandle | null>(null);
  if (typeaheadRef.current === null) {
    typeaheadRef.current = createTypeahead({ timeout: resolved.typeaheadTimeout });
  }
  useEffect(() => () => typeaheadRef.current?.destroy(), []);

  const moveTo = useCallback(
    (rows: readonly Row[], index: number, event: KeyboardEvent<HTMLElement>) => {
      const row = rows[index];
      if (row === undefined) return;
      requestActive(row.key, 'keyboard', event);
      row.element.focus();
      if (resolved.selectOnFocus) applySelection(row.key, event, 'replace', 'keyboard');
    },
    [applySelection, requestActive, resolved.selectOnFocus],
  );

  const move = useCallback(
    (rows: readonly Row[], intent: MoveIntent, event: KeyboardEvent<HTMLElement>) => {
      const enabled = rows.map((row) => resolved.navigateDisabled || !row.disabled);
      const next = moveIndex({
        enabled,
        from: indexOfActive(rows),
        intent,
        loop: resolved.loop,
        page: resolved.pageSize,
      });
      if (next !== -1) moveTo(rows, next, event);
    },
    [moveTo, resolved.loop, resolved.navigateDisabled, resolved.pageSize, active],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented || resolved.disabled === true) return;
    /* Arrow navigation stands down while focus is inside a control the reader
       is typing in, which is what makes an inline rename composable. */
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable="true"]') !== null) return;

    const rows = readRows();
    if (rows.length === 0) return;
    const index = indexOfActive(rows);
    const row = index === -1 ? undefined : (rows[index] as Row);
    const rtl = canvasRef.current ? getComputedStyle(canvasRef.current).direction === 'rtl' : false;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

    const take = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    switch (event.key) {
      case 'ArrowDown':
        take();
        if (event.shiftKey && resolved.selectionMode === 'multiple') {
          const next = moveIndex({
            enabled: rows.map((candidate) => resolved.navigateDisabled || !candidate.disabled),
            from: index,
            intent: 'next',
            loop: resolved.loop,
          });
          if (next !== -1) {
            moveTo(rows, next, event);
            applySelection((rows[next] as Row).key, event, 'toggle', 'keyboard');
          }
          return;
        }
        move(rows, 'next', event);
        return;
      case 'ArrowUp':
        take();
        if (event.shiftKey && resolved.selectionMode === 'multiple') {
          const previous = moveIndex({
            enabled: rows.map((candidate) => resolved.navigateDisabled || !candidate.disabled),
            from: index,
            intent: 'previous',
            loop: resolved.loop,
          });
          if (previous !== -1) {
            moveTo(rows, previous, event);
            applySelection((rows[previous] as Row).key, event, 'toggle', 'keyboard');
          }
          return;
        }
        move(rows, 'previous', event);
        return;
      case 'Home':
        take();
        if (event.ctrlKey && event.shiftKey && row !== undefined) {
          anchorRef.current = (rows[0] as Row).key;
          applySelection(row.key, event, 'range', 'keyboard');
          return;
        }
        move(rows, 'first', event);
        return;
      case 'End':
        take();
        if (event.ctrlKey && event.shiftKey && row !== undefined) {
          anchorRef.current = (rows[rows.length - 1] as Row).key;
          applySelection(row.key, event, 'range', 'keyboard');
          return;
        }
        move(rows, 'last', event);
        return;
      case 'PageDown':
        take();
        move(rows, 'pageDown', event);
        return;
      case 'PageUp':
        take();
        move(rows, 'pageUp', event);
        return;
      case forward: {
        take();
        if (row === undefined) return;
        if (!row.branch) return;
        if (!expanded.includes(row.key)) {
          setExpanded(row.key, true, 'keyboard', event);
          return;
        }
        if (index + 1 < rows.length && (rows[index + 1] as Row).depth > row.depth) {
          moveTo(rows, index + 1, event);
        }
        return;
      }
      case backward: {
        take();
        if (row === undefined) return;
        if (row.branch && expanded.includes(row.key)) {
          setExpanded(row.key, false, 'keyboard', event);
          return;
        }
        const parent = parentOf(rows, index);
        if (parent !== -1) moveTo(rows, parent, event);
        return;
      }
      case 'Enter':
        take();
        if (row === undefined) return;
        if (row.branch && resolved.expandOn === 'row') {
          setExpanded(row.key, !expanded.includes(row.key), 'keyboard', event);
        }
        if (resolved.selectionMode !== 'none') {
          applySelection(row.key, event, 'replace', 'keyboard');
        }
        onNodeActivate?.(row.key, 'keyboard');
        return;
      case ' ':
        take();
        if (row === undefined) return;
        if (event.shiftKey) {
          applySelection(row.key, event, 'range', 'keyboard');
          return;
        }
        applySelection(row.key, event, 'toggle', 'keyboard');
        return;
      case 'a':
      case 'A':
        if (!(event.ctrlKey || event.metaKey)) break;
        take();
        applySelection(row?.key ?? '', event, 'all', 'keyboard');
        return;
      case '*': {
        take();
        if (row === undefined) return;
        /* Every sibling at this level, which is every rendered row of the same
           depth under the same parent. */
        const parent = parentOf(rows, index);
        const siblings = rows
          .filter(
            (candidate, step) => candidate.depth === row.depth && parentOf(rows, step) === parent,
          )
          .filter((candidate) => candidate.branch)
          .map((candidate) => candidate.key);
        const next = [...new Set([...expanded, ...siblings])];
        if (!same(next, expanded)) requestExpanded(next, 'keyboard', event);
        return;
      }
      default:
        break;
    }

    if (!resolved.typeahead || !isPrintable(event.key) || event.ctrlKey || event.metaKey) return;
    const match = typeaheadRef.current?.match(
      event.key,
      rows.map((candidate) => candidate.label),
      index,
    );
    if (match === undefined || match === -1) return;
    take();
    moveTo(rows, match, event);
  };

  /* ── Focus ──────────────────────────────────────────────────────────── */

  const activedescendant =
    resolved.focusMode === 'activedescendant' ||
    (resolved.focusMode === 'auto' && resolved.virtual);

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target !== canvasRef.current || activedescendant) return;
    const rows = readRows();
    if (rows.length === 0) return;
    /* The pattern: the selected node when there is one, otherwise the first. */
    const wanted =
      rows.find((row) => chosen.has(row.key) && !row.disabled) ?? rows.find((row) => !row.disabled);
    if (wanted === undefined) return;
    requestActive(wanted.key, 'keyboard', event);
    wanted.element.focus();
  };

  /* ── The imperative surface ─────────────────────────────────────────── */

  const revealPath = useCallback(
    (key: string) => {
      if (collection === undefined) return expanded;
      const path = collection.ancestorsOf(key);
      const next = [...new Set([...expanded, ...path])];
      return next;
    },
    [collection, expanded],
  );

  useImperativeHandle(
    handleRef,
    (): TreeHandle => ({
      focus: () => {
        const rows = readRows();
        const wanted = rows.find((row) => row.key === active) ?? rows[0];
        (wanted?.element ?? canvasRef.current)?.focus();
      },
      scrollToKey: (key, align: TreeAlignment = 'nearest') => {
        const next = revealPath(key);
        if (!same(next, expanded)) requestExpanded(next, 'programmatic', undefined);
        const row = readRows().find((candidate) => candidate.key === key);
        row?.element.scrollIntoView({ block: align === 'nearest' ? 'nearest' : align });
      },
      expand: (key) => {
        const next = [...new Set([...revealPath(key), key])];
        if (!same(next, expanded)) requestExpanded(next, 'programmatic', undefined);
      },
      collapse: (key) => setExpanded(key, false, 'programmatic', undefined),
      expandAll: () => {
        if (collection === undefined) return;
        requestExpanded(collection.branchKeys, 'programmatic', undefined);
      },
      collapseAll: () => requestExpanded([], 'programmatic', undefined),
      getActiveKey: () => active,
      getElement: () => rootRef.current,
    }),
    [active, collection, expanded, readRows, requestExpanded, revealPath, setExpanded],
  );

  /* ── The window ─────────────────────────────────────────────────────── */

  /**
   * The rows a window measures are `visible(expandedKeys)` and not the whole
   * hierarchy: a closed branch contributes nothing to the canvas, and a window
   * sized over the collection would leave the scrollbar promising rows that are
   * not there. The list is rebuilt on every expansion for that reason.
   */
  const windowed = resolved.virtual && collection !== undefined;

  const visible: readonly TreeNodeData<T>[] = useMemo(
    () => (collection === undefined ? [] : collection.visible(expanded)),
    [collection, expanded],
  );

  const [viewportSize, setViewportSize] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  /**
   * Before the paint, not after it.
   *
   * A viewport of nought renders a window of one row, and `useEffect` runs once
   * the browser has already painted that row — so a tree of four thousand
   * showed its first name and nothing else for a frame. `useLayoutEffect`
   * measures while the browser is still holding the frame, so the first thing
   * painted is the right window. It is guarded because it has no meaning on the
   * server, where there is no viewport to measure and React warns about the
   * hook that says there is.
   */
  const useMeasure = typeof window === 'undefined' ? useEffect : useLayoutEffect;

  useMeasure(() => {
    if (!windowed) return undefined;
    const root = rootRef.current;
    if (root === null) return undefined;

    const read = () => {
      setViewportSize(root.clientHeight);
      setScrollOffset(root.scrollTop);
    };
    read();

    root.addEventListener('scroll', read, { passive: true });
    /* A `ResizeObserver` where there is one, and nothing where there is not: a
       runtime without one still measures on mount and on every scroll. */
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    observer?.observe(root);
    return () => {
      root.removeEventListener('scroll', read);
      observer?.disconnect();
    };
  }, [windowed]);

  const slice = useMemo(() => {
    if (!windowed) return undefined;
    const activeIndex = visible.findIndex((node) => node.key === active);
    const anchorIndex = visible.findIndex((node) => node.key === anchorRef.current);
    return virtualWindow({
      itemCount: visible.length,
      itemSize: resolved.itemSize,
      overscan: resolved.overscan,
      pinned: [activeIndex, anchorIndex].filter((index) => index !== -1),
      scrollOffset,
      viewportSize,
    });
  }, [active, resolved.itemSize, resolved.overscan, scrollOffset, viewportSize, visible, windowed]);

  /* ── What every part reads ──────────────────────────────────────────── */

  const positions = useMemo(() => {
    if (collection === undefined || resolvedStructure !== 'flat') return undefined;
    return collection;
  }, [collection, resolvedStructure]);

  const context: TreeContextValue = {
    disabled: resolved.disabled,
    expandOn: resolved.expandOn,
    guides: resolved.guides,
    holdsSelection,
    indicator,
    isActive: (key) => key === active,
    /**
     * A branch the reader opened, or one a query is holding open.
     *
     * A filter that asked for the expansion instead would move the reader's own
     * set and have to put it back when the query emptied, and a reader who
     * cleared a search would find branches open that they never opened.
     * Holding the path open for as long as the query lasts keeps the set the
     * reader owns untouched, and keeps `aria-expanded` telling the truth about
     * what is on screen.
     */
    isExpanded: (key) => isOpen(key),
    isIndeterminate: (key) => indeterminate.has(key),
    isNodeDisabled: (key) => readRows().find((row) => row.key === key)?.disabled === true,
    isSelected: (key) => chosen.has(key),
    labelId: (key) => `${baseId}-label-${key}`,
    levelOf: (key) => {
      const node = positions?.nodeFor(key);
      return node === undefined ? undefined : node.level + 1;
    },
    nodeId: (key) => `${baseId}-node-${key}`,
    nodeTabIndex: (key) => {
      if (activedescendant) return undefined;
      if (active === null) return -1;
      return key === active ? 0 : -1;
    },
    posInSetOf: (key) => positions?.nodeFor(key)?.posInSet,
    press,
    pressExpander,
    pressIndicator,
    readOnly,
    selectionMode: resolved.selectionMode,
    setSizeOf: (key) => positions?.nodeFor(key)?.setSize,
    structure: resolvedStructure,
  };

  /* ── The data-driven shape ──────────────────────────────────────────── */

  const label = useCallback(
    (item: T) => (getLabel ? getLabel(item) : (getKey?.(item) ?? '')),
    [getKey, getLabel],
  );

  const marked = useCallback(
    (text: string): ReactNode => {
      if (query === undefined || query.trim() === '') return text;
      return splitByMatch(text, query).map((run, index) =>
        run.matched ? <mark key={index}>{run.text}</mark> : run.text,
      );
    },
    [query],
  );

  const renderCollection = (keys: readonly string[]): ReactNode => {
    if (collection === undefined) return null;
    return keys.map((key) => {
      const node = collection.nodeFor(key);
      if (node === undefined) return null;
      if (filtered !== undefined && !filtered.kept.has(key)) return null;
      const open = isOpen(key);
      return (
        <TreeNode
          key={key}
          value={key}
          label={renderNode ? renderNode(node.item, key) : marked(label(node.item))}
          {...(node.disabled ? { disabled: true } : {})}
          {...(node.hasChildren ? { hasChildren: true } : {})}
          {...(isNodeLoading?.(node.item) === true ? { loading: true } : {})}
          {...(filtered === undefined
            ? {}
            : { match: filtered.hits.has(key) ? ('hit' as const) : ('ancestor' as const) })}
          textValue={label(node.item)}
        >
          {node.hasChildren && open && node.children.length > 0
            ? renderCollection(node.children)
            : undefined}
        </TreeNode>
      );
    });
  };

  /**
   * The flat shape renders one sequence and states each node's level, which is
   * the condition the pattern names: "if the complete set of available nodes is
   * not present in the DOM due to dynamic loading as the user moves focus in or
   * scrolls the tree". A window is exactly that condition, and the three
   * properties are what replace the nesting a slice cannot carry.
   */
  const flatNode = (node: TreeNodeData<T>, pinned: boolean) => (
    <TreeNode
      key={node.key}
      value={node.key}
      depth={node.level}
      label={renderNode ? renderNode(node.item, node.key) : marked(label(node.item))}
      {...(node.disabled ? { disabled: true } : {})}
      {...(node.hasChildren ? { hasChildren: true } : {})}
      {...(isNodeLoading?.(node.item) === true ? { loading: true } : {})}
      {...(pinned ? { pinned: true, offset: visible.indexOf(node) * resolved.itemSize } : {})}
      textValue={label(node.item)}
    />
  );

  const renderWindow = () => {
    if (slice === undefined) return null;
    const rows = visible
      .slice(slice.startIndex, slice.endIndex)
      .map((node) => flatNode(node, false));
    const pinned = [...slice.pinnedBefore, ...slice.pinnedAfter]
      .map((index) => visible[index])
      .filter((node): node is TreeNodeData<T> => node !== undefined)
      .map((node) => flatNode(node, true));
    return [...pinned, ...rows];
  };

  const body =
    collection === undefined
      ? children
      : resolvedStructure === 'flat'
        ? windowed
          ? renderWindow()
          : visible.map((node) => flatNode(node, false))
        : renderCollection(collection.roots);

  const holdsNothing =
    collection !== undefined
      ? collection.nodes.length === 0 || (filtered !== undefined && filtered.kept.size === 0)
      : false;

  const rootProps: TreeRootProps = keyedProps({
    ...nativeProps,
    ...(resolved.disabled ? { 'data-disabled': '' as const } : {}),
    'data-expand-on': resolved.expandOn,
    'data-focus-mode': activedescendant ? 'activedescendant' : 'roving',
    'data-guides': resolved.guides ? 'true' : 'false',
    'data-indicator': indicator,
    ...(invalid === true ? { 'data-invalid': '' as const } : {}),
    ...(loading === true ? { 'data-loading': '' as const } : {}),
    'data-part': 'root',
    ...(readOnly === true ? { 'data-readonly': '' as const } : {}),
    ...(required === true ? { 'data-required': '' as const } : {}),
    'data-selection': resolved.selectionMode,
    'data-size': resolved.size,
    'data-structure': resolvedStructure,
    'data-ui': 'tree',
    'data-variant': resolved.variant,
  });

  const canvas = (
    <ul
      ref={canvasRef}
      data-part="canvas"
      data-part-canvas=""
      role="tree"
      aria-busy={loading === true ? true : undefined}
      aria-disabled={resolved.disabled ? true : undefined}
      aria-invalid={invalid === true ? true : undefined}
      aria-label={nativeProps['aria-label']}
      aria-labelledby={nativeProps['aria-labelledby']}
      aria-multiselectable={resolved.selectionMode === 'multiple' ? true : undefined}
      aria-required={required === true ? true : undefined}
      {...(activedescendant && active !== null
        ? { 'aria-activedescendant': context.nodeId(active) }
        : {})}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      style={
        slice === undefined
          ? undefined
          : ({
              '--_canvas-size': `${slice.totalSize}px`,
              '--_canvas-offset': `${slice.startOffset}px`,
            } as CSSProperties)
      }
      tabIndex={activedescendant || active === null ? 0 : -1}
    >
      <TreeDepthContext.Provider value={0}>{body}</TreeDepthContext.Provider>
    </ul>
  );

  const content = (
    <TreeContext.Provider value={context}>
      {canvas}
      {holdsNothing && emptyContent !== undefined ? (
        <div data-part="empty" data-part-empty="">
          {emptyContent}
        </div>
      ) : null}
      {name === undefined
        ? null
        : selected.map((key) => <input key={key} type="hidden" name={name} value={key} readOnly />)}
    </TreeContext.Provider>
  );

  if (render) return render({ ...rootProps, children: content });

  return (
    <div
      {...rootProps}
      ref={(element) => {
        rootRef.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
    >
      {content}
    </div>
  );
}
