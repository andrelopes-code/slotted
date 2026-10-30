import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/listbox/listbox.css';

import {
  createCollection,
  createRowMetrics,
  moveIndex,
  nextSelection,
  offsetForIndex,
  shouldLoadMore,
  virtualWindow,
} from '@slotted/core/collection';
import type {
  Collection,
  MoveIntent,
  RowMetrics,
  SelectionAction,
  SelectionBehavior,
} from '@slotted/core/collection';
import { createControllable } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, ReactNode } from 'react';

import { useField, useFieldDefaults } from '../field';
import { ListboxContext } from './listbox-context';
import { useListboxDefaults } from './listbox-defaults';
import { ListboxEmpty, ListboxLoader, ListboxOption, OPTION_SELECTOR } from './listbox-parts';
import type {
  ListboxActiveReason,
  ListboxAlignment,
  ListboxChangeRequest,
  ListboxContextValue,
  ListboxHandle,
  ListboxProps,
  ListboxRootProps,
  ListboxSelectionReason,
  ListboxValue,
} from './listbox.types';

/** The collection as the reducers want it, however the family came by it. */
interface Snapshot {
  keys: readonly string[];
  labels: readonly string[];
  disabled: readonly boolean[];
}

const EMPTY_SNAPSHOT: Snapshot = { keys: [], labels: [], disabled: [] };

function toKeys(value: ListboxValue | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

function sameKeys(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function selector(key: string) {
  return `${OPTION_SELECTOR}[data-key="${CSS.escape(key)}"]`;
}

/**
 * A list of options the reader chooses from, and the primitive `select`,
 * `combobox` and the pickers are built on.
 *
 * ── Where the collection comes from ─────────────────────────────────────
 *
 * Two ways in, one shape out. Written declaratively, the collection is read
 * from the rendered options in DOM order — which is the reading order, survives
 * arbitrary nesting inside groups, and cannot disagree with what the reader
 * sees. Handed `items` or `sections`, it is built by
 * `@slotted/core/collection`, which is the only way a listbox can window a set
 * larger than the DOM or report a set the DOM does not hold.
 *
 * ── Two mutable values ──────────────────────────────────────────────────
 *
 * The pattern is explicit that they are two: "DOM focus (the active element) is
 * functionally distinct from the selected state". `value` is what the reader
 * chose and `activeKey` is where the keyboard is, and a `select` reopening onto
 * the option chosen last time needs the second and nothing else.
 *
 * ── The focus model is read, not asked for ──────────────────────────────
 *
 * `focusMode="auto"` answers `activedescendant` whenever the set is windowed,
 * because a roving `tabindex` cannot survive its own element being recycled:
 * the element carrying `tabindex="0"` is removed while it holds focus, and
 * focus falls to the document body.
 */
export function Listbox<T = unknown>({
  activeKey,
  children,
  columns,
  defaultActiveKey,
  defaultValue,
  disabled,
  disallowEmptySelection,
  disallowSelectAll,
  emptyContent,
  focusMode,
  getKey,
  getLabel,
  handleRef,
  hasMore,
  indicator,
  invalid,
  isItemDisabled,
  itemSize,
  items,
  loaderContent,
  loadMoreThreshold,
  loading,
  loop,
  name,
  navigateDisabled,
  onActiveKeyChange,
  onBlur,
  onFocus,
  onKeyDown,
  onLoadMore,
  onValueChange,
  orientation,
  overscan,
  pageSize,
  readOnly,
  ref,
  render,
  renderOption,
  required,
  rows,
  sections,
  sectionSize,
  selectOnFocus,
  selectionBehavior,
  selectionMode,
  size,
  style,
  totalCount,
  typeahead,
  typeaheadTimeout,
  value,
  variant,
  virtual,
  ...nativeProps
}: ListboxProps<T>) {
  const defaults = useListboxDefaults();
  const field = useField();
  const fieldDefaults = useFieldDefaults();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<string | undefined>(undefined);
  const typeaheadRef = useRef<TypeaheadHandle | null>(null);
  const idPrefix = useId();

  const resolved = {
    columns: Math.max(Math.floor(columns ?? defaults.columns), 1),
    disallowEmptySelection: disallowEmptySelection ?? defaults.disallowEmptySelection,
    disallowSelectAll: disallowSelectAll ?? defaults.disallowSelectAll,
    indicator: indicator ?? defaults.indicator,
    loadMoreThreshold: loadMoreThreshold ?? defaults.loadMoreThreshold,
    loop: loop ?? defaults.loop,
    navigateDisabled: navigateDisabled ?? defaults.navigateDisabled,
    orientation: orientation ?? defaults.orientation,
    overscan: overscan ?? defaults.overscan,
    pageSize: pageSize ?? defaults.pageSize,
    rows: rows ?? defaults.rows,
    selectOnFocus: selectOnFocus ?? defaults.selectOnFocus,
    selectionBehavior: selectionBehavior ?? defaults.selectionBehavior,
    selectionMode: selectionMode ?? defaults.selectionMode,
    size: size ?? field?.size ?? defaults.size,
    typeahead: typeahead ?? defaults.typeahead,
    typeaheadTimeout: typeaheadTimeout ?? defaults.typeaheadTimeout,
    variant: variant ?? defaults.variant,
  };

  const isDisabled = disabled ?? field?.disabled ?? fieldDefaults.disabled;
  const isReadOnly = readOnly ?? field?.readOnly ?? fieldDefaults.readOnly;
  const isInvalid = invalid ?? field?.invalid;
  const isRequired = required ?? field?.required;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  const windowed = virtual === true && (itemSize ?? 0) > 0;
  const asked = focusMode ?? defaults.focusMode;
  const mode: 'roving' | 'activedescendant' =
    asked === 'auto' ? (windowed ? 'activedescendant' : 'roving') : asked;

  /* ── The collection ─────────────────────────────────────────────────── */

  const collection: Collection<T> | undefined = useMemo(() => {
    if (items === undefined && sections === undefined) return undefined;
    return createCollection<T>({
      ...(items === undefined ? {} : { items }),
      ...(sections === undefined ? {} : { sections }),
      getKey: getKey === undefined ? (_item, index) => String(index) : (item) => getKey(item),
      ...(getLabel === undefined ? {} : { getLabel }),
      ...(isItemDisabled === undefined ? {} : { isDisabled: isItemDisabled }),
      ...(totalCount === undefined ? {} : { totalCount }),
    });
  }, [items, sections, getKey, getLabel, isItemDisabled, totalCount]);

  /**
   * The collection as the reducers want it, read at the moment of a key press
   * rather than held in state: an option added or removed between two presses
   * is already accounted for, and nothing has to be registered or ordered by
   * mount time.
   */
  const snapshot = useCallback((): Snapshot => {
    if (collection !== undefined) {
      return {
        keys: collection.keys,
        labels: collection.labels,
        disabled: collection.options.map((option) => option.disabled),
      };
    }
    const root = rootRef.current;
    if (root === null) return EMPTY_SNAPSHOT;
    const nodes = [...root.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
    return {
      keys: nodes.map((node) => node.dataset['key'] ?? ''),
      labels: nodes.map((node) => node.dataset['textValue'] ?? node.textContent?.trim() ?? ''),
      disabled: nodes.map((node) => node.getAttribute('aria-disabled') === 'true'),
    };
  }, [collection]);

  /* ── State ──────────────────────────────────────────────────────────── */

  const [ownKeys, setOwnKeys] = useState<readonly string[]>(() => toKeys(defaultValue));
  const controlled = value !== undefined;
  const selected = controlled ? toKeys(value) : ownKeys;

  const [ownActive, setOwnActive] = useState<string | null>(defaultActiveKey ?? null);
  const activeControlled = activeKey !== undefined;
  const active = activeControlled ? (activeKey ?? null) : ownActive;

  const outward = useCallback(
    (keys: readonly string[]): ListboxValue =>
      resolved.selectionMode === 'multiple' ? keys : (keys[0] ?? null),
    [resolved.selectionMode],
  );

  const requestSelection = useCallback(
    (keys: readonly string[], reason: ListboxSelectionReason, source: unknown) => {
      let cancelled = false;
      const state = createControllable<readonly string[]>({
        ...(controlled ? { controlled: selected } : {}),
        initial: selected,
        equals: sameKeys,
        onRequest: (request) => {
          /* The request the consumer sees carries the shape the consumer gave:
             one key in single selection, the set in multiple. The reducer works
             in arrays throughout, and this is the one place the two meet. */
          const outwardRequest: ListboxChangeRequest = {
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

  const requestActive = useCallback(
    (key: string | null, reason: ListboxActiveReason, source: unknown) => {
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

  /* ── Windowing ──────────────────────────────────────────────────────── */

  const [viewportSize, setViewportSize] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  /**
   * A prefix-sum table only when the rows differ, which is only when the
   * collection has sections: a group label is not an option's height, and one
   * multiplication over both drifts further from the canvas with every group.
   * Without sections the engine keeps its two multiplications.
   */
  const rowMetrics: RowMetrics | undefined = useMemo(() => {
    if (!windowed || collection === undefined || sections === undefined) return undefined;
    const option = itemSize ?? 0;
    const label = sectionSize ?? option;
    return createRowMetrics(collection.rows.map((row) => (row.kind === 'option' ? option : label)));
  }, [collection, itemSize, sections, sectionSize, windowed]);

  useEffect(() => {
    if (!windowed) return undefined;
    const root = rootRef.current;
    if (root === null) return undefined;

    const read = () => {
      setViewportSize(root.clientHeight);
      setScrollOffset(root.scrollTop);
    };
    read();

    /* A `ResizeObserver` where there is one, and the viewport's own resize
       where there is not: a test environment and an old browser both answer
       the second, and a window that never re-measured would render the first
       frame's slice forever. */
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    observer?.observe(root);
    const view = root.ownerDocument.defaultView;
    if (observer === undefined) view?.addEventListener('resize', read);
    root.addEventListener('scroll', read, { passive: true });
    return () => {
      observer?.disconnect();
      if (observer === undefined) view?.removeEventListener('resize', read);
      root.removeEventListener('scroll', read);
    };
  }, [windowed]);

  const activeRow = active === null ? -1 : (collection?.optionFor(active)?.row ?? -1);
  const anchorRow =
    anchorRef.current === undefined ? -1 : (collection?.optionFor(anchorRef.current)?.row ?? -1);

  const slice = useMemo(
    () =>
      virtualWindow({
        itemCount: collection?.rows.length ?? 0,
        ...(rowMetrics === undefined ? { itemSize: itemSize ?? 0 } : { metrics: rowMetrics }),
        overscan: resolved.overscan,
        scrollOffset,
        viewportSize,
        pinned: [activeRow, anchorRow],
      }),
    [
      activeRow,
      anchorRow,
      collection,
      itemSize,
      resolved.overscan,
      rowMetrics,
      scrollOffset,
      viewportSize,
    ],
  );

  const rowOffset = useCallback(
    (row: number) => rowMetrics?.offsetOf(row) ?? row * (itemSize ?? 0),
    [itemSize, rowMetrics],
  );

  /* ── Where the keyboard is, and how it gets there ───────────────────── */

  const scrollToIndex = useCallback(
    (index: number, align: ListboxAlignment) => {
      const root = rootRef.current;
      if (root === null || index < 0) return;

      if (!windowed) {
        const key = snapshot().keys[index];
        if (key === undefined) return;
        /* Optional-called: `scrollIntoView` is absent in jsdom, and a family
           that assumed it made every keyboard test in the suite throw. */
        root
          .querySelector<HTMLElement>(selector(key))
          ?.scrollIntoView?.({ block: align === 'nearest' ? 'nearest' : 'center' });
        return;
      }

      root.scrollTop = offsetForIndex({
        index: collection?.options[index]?.row ?? index,
        itemCount: collection?.rows.length ?? 0,
        ...(rowMetrics === undefined ? { itemSize: itemSize ?? 0 } : { metrics: rowMetrics }),
        scrollOffset: root.scrollTop,
        viewportSize: root.clientHeight,
        align,
      });
    },
    [collection, itemSize, rowMetrics, snapshot, windowed],
  );

  const moveActive = useCallback(
    (index: number, source: unknown, keys: readonly string[]) => {
      const key = keys[index];
      if (key === undefined) return;
      requestActive(key, 'keyboard', source);
      scrollToIndex(index, 'nearest');
      if (mode === 'roving') rootRef.current?.querySelector<HTMLElement>(selector(key))?.focus();
    },
    [mode, requestActive, scrollToIndex],
  );

  /* ── Selection ──────────────────────────────────────────────────────── */

  const applySelection = useCallback(
    (
      action: SelectionAction,
      key: string | undefined,
      reason: ListboxSelectionReason,
      source: unknown,
      behavior: SelectionBehavior = resolved.selectionBehavior,
    ) => {
      if (resolved.selectionMode === 'none' || isReadOnly === true) return;
      const snap = snapshot();
      const result = nextSelection({
        action,
        behavior,
        mode: resolved.selectionMode,
        selected,
        keys: snap.keys,
        ...(key === undefined ? {} : { key }),
        ...(anchorRef.current === undefined ? {} : { anchor: anchorRef.current }),
        disabled: (candidate) => snap.disabled[snap.keys.indexOf(candidate)] === true,
        disallowEmpty: resolved.disallowEmptySelection,
        disallowSelectAll: resolved.disallowSelectAll,
      });
      anchorRef.current = result.anchor;
      if (!result.changed) return;
      requestSelection(result.selected, reason, source);
    },
    [
      isReadOnly,
      requestSelection,
      resolved.disallowEmptySelection,
      resolved.disallowSelectAll,
      resolved.selectionBehavior,
      resolved.selectionMode,
      selected,
      snapshot,
    ],
  );

  /* ── The keyboard ───────────────────────────────────────────────────── */

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || isDisabled === true) return;

    const snap = snapshot();
    if (snap.keys.length === 0) return;

    const enabled = snap.keys.map(
      (_, index) => resolved.navigateDisabled || snap.disabled[index] !== true,
    );
    const from = active === null ? -1 : snap.keys.indexOf(active);
    const modifier = event.ctrlKey || event.metaKey;
    const root = rootRef.current;
    const rtl =
      root !== null && root.ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl';

    /**
     * A row in a two-dimensional arrangement is `pageDown` with the page set to
     * `columns`. The engine's page arithmetic already clamps rather than
     * wrapping and lands on the nearest enabled option inward, which is exactly
     * what a row step needs, so `columns` is a number here instead of two more
     * intents in the shared vocabulary.
     */
    const step = (intent: MoveIntent, page?: number) => {
      const index = moveIndex({
        enabled,
        from,
        intent,
        loop: resolved.loop,
        ...(page === undefined ? {} : { page }),
      });
      if (index === -1 || index === from) return;
      event.preventDefault();
      moveActive(index, event, snap.keys);

      const key = snap.keys[index];
      if (key === undefined || snap.disabled[index] === true) return;
      /* Shift moves and toggles, which is the pattern's optional pair; Control
         moves and leaves the selection alone, which is the alternative model's
         answer to a plain arrow that would otherwise replace it. */
      if (event.shiftKey && resolved.selectionMode === 'multiple') {
        applySelection('toggle', key, 'keyboard', event, 'toggle');
      } else if (!modifier && resolved.selectOnFocus) {
        applySelection('replace', key, 'keyboard', event);
      }
    };

    const edge = (intent: 'first' | 'last') => {
      const index = moveIndex({ enabled, from, intent });
      if (index === -1) return;
      event.preventDefault();
      const key = snap.keys[index];
      moveActive(index, event, snap.keys);
      /* Control+Shift+Home and Control+Shift+End select the active option and
         everything up to the end, which the pattern lists as optional and no
         surveyed implementation ships. */
      if (modifier && event.shiftKey && key !== undefined) {
        applySelection('range', key, 'keyboard', event, 'toggle');
      } else if (!modifier && resolved.selectOnFocus && key !== undefined) {
        applySelection('replace', key, 'keyboard', event);
      }
    };

    const inlineNext = rtl ? 'ArrowLeft' : 'ArrowRight';
    const inlinePrevious = rtl ? 'ArrowRight' : 'ArrowLeft';
    const horizontal = resolved.orientation === 'horizontal';
    const grid = resolved.columns > 1;

    if (event.key === 'ArrowDown' && !horizontal) {
      return grid ? step('pageDown', resolved.columns) : step('next');
    }
    if (event.key === 'ArrowUp' && !horizontal) {
      return grid ? step('pageUp', resolved.columns) : step('previous');
    }
    if (event.key === inlineNext && (horizontal || grid)) return step('next');
    if (event.key === inlinePrevious && (horizontal || grid)) return step('previous');
    if (event.key === 'Home') return edge('first');
    if (event.key === 'End') return edge('last');
    if (event.key === 'PageDown') return step('pageDown', resolved.pageSize);
    if (event.key === 'PageUp') return step('pageUp', resolved.pageSize);

    const sequenceOpen = (typeaheadRef.current?.query.length ?? 0) > 0;

    if ((event.key === ' ' && !sequenceOpen) || event.key === 'Enter') {
      if (active === null) return;
      event.preventDefault();
      if (event.shiftKey && resolved.selectionMode === 'multiple') {
        applySelection('range', active, 'keyboard', event, 'toggle');
      } else {
        /* Control+Space toggles even under the alternative model, where a plain
           Space replaces. It is the one key that says "this one as well". */
        applySelection('toggle', active, 'keyboard', event, modifier ? 'toggle' : undefined);
      }
      return;
    }

    if (modifier && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      applySelection('all', undefined, 'select', event);
      return;
    }

    if (resolved.typeahead && !modifier && isPrintable(event.key, sequenceOpen)) {
      typeaheadRef.current ??= createTypeahead({ timeout: resolved.typeaheadTimeout });
      const index = typeaheadRef.current.match(event.key, snap.labels, from);
      if (index === -1) return;
      event.preventDefault();
      moveActive(index, event, snap.keys);
      if (resolved.selectOnFocus) {
        const key = snap.keys[index];
        if (key !== undefined) applySelection('replace', key, 'keyboard', event);
      }
    }
  };

  useEffect(() => () => typeaheadRef.current?.destroy(), []);

  /* ── Focus ──────────────────────────────────────────────────────────── */

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    if (event.defaultPrevented || isDisabled === true) return;
    if (event.target !== rootRef.current || active !== null) return;

    /* The pattern: focus lands on the selected option when there is one and on
       the first option otherwise, in both single and multiple selection. */
    const snap = snapshot();
    const enabled = snap.keys.map(
      (_, index) => resolved.navigateDisabled || snap.disabled[index] !== true,
    );
    const chosen = selected.length > 0 ? snap.keys.indexOf(selected[0] as string) : -1;
    const index =
      chosen !== -1 && enabled[chosen] === true
        ? chosen
        : moveIndex({ enabled, from: -1, intent: 'first' });
    if (index !== -1) moveActive(index, event, snap.keys);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    /**
     * Only when focus has actually left the listbox. Under the roving model the
     * family moves focus from option to option on every key, and each of those
     * moves raises a `focusout` on the root: resetting on all of them cleared
     * the typeahead buffer after every character, so a sequence longer than one
     * letter could never be typed and no test of a single letter would say so.
     */
    const next = event.relatedTarget as Node | null;
    if (next === null || rootRef.current?.contains(next) !== true) {
      typeaheadRef.current?.reset();
    }
  };

  /* ── Incremental loading ────────────────────────────────────────────── */

  const loadedCount = collection?.options.length ?? 0;

  useEffect(() => {
    if (onLoadMore === undefined || collection === undefined) return;
    if (
      shouldLoadMore({
        endIndex: windowed ? slice.endIndex : collection.rows.length,
        loadedCount: collection.rows.length,
        threshold: resolved.loadMoreThreshold,
        hasMore: hasMore === true,
        loading: loading === true,
      })
    ) {
      onLoadMore();
    }
  }, [
    collection,
    hasMore,
    loadedCount,
    loading,
    onLoadMore,
    resolved.loadMoreThreshold,
    slice.endIndex,
    windowed,
  ]);

  /* ── The imperative handle ──────────────────────────────────────────── */

  useImperativeHandle(
    handleRef,
    (): ListboxHandle => ({
      focus: () => {
        const root = rootRef.current;
        if (root === null) return;
        if (mode === 'activedescendant' || active === null) {
          root.focus();
          return;
        }
        root.querySelector<HTMLElement>(selector(active))?.focus();
      },
      getActiveKey: () => active,
      getElement: () => rootRef.current,
      scrollToKey: (key, align = 'nearest') => {
        const index = snapshot().keys.indexOf(key);
        if (index !== -1) scrollToIndex(index, align);
      },
    }),
    [active, mode, scrollToIndex, snapshot],
  );

  /* ── What the parts are told ────────────────────────────────────────── */

  const press: ListboxContextValue['press'] = (key, event) => {
    if (isDisabled === true) return;
    const snap = snapshot();
    const index = snap.keys.indexOf(key);
    const optionDisabled = index !== -1 && snap.disabled[index] === true;

    if (mode === 'roving') rootRef.current?.querySelector<HTMLElement>(selector(key))?.focus();
    else rootRef.current?.focus();

    if (optionDisabled && !resolved.navigateDisabled) return;
    requestActive(key, 'pointer', event);
    if (optionDisabled) return;

    if (event.shiftKey) applySelection('range', key, 'pointer', event);
    /* Control or Command adds one, whichever model is in force: it is the press
       that says "this one as well" and it means that in both. */
    else if (event.ctrlKey || event.metaKey) {
      applySelection('toggle', key, 'pointer', event, 'toggle');
    } else applySelection('toggle', key, 'pointer', event);
  };

  const context: ListboxContextValue = {
    disabled: isDisabled,
    readOnly: isReadOnly,
    indicator: resolved.indicator,
    selectionMode: resolved.selectionMode,
    isSelected: (key) => selected.includes(key),
    isActive: (key) => key === active,
    optionId: (key) => `${idPrefix}${key}`,
    optionTabIndex: (key) => (mode === 'roving' ? (key === active ? 0 : -1) : undefined),
    press,
    /**
     * Both are written only when the collection is known, which is exactly when
     * the pattern requires them: "if the complete set of available options is
     * not present in the DOM due to dynamic loading, their aria-setsize and
     * aria-posinset attributes are set appropriately". With declarative
     * children the whole set *is* in the DOM and the platform counts it — and a
     * number React could only read from the DOM would be nothing on the server
     * and a count on the client, which is a hydration mismatch.
     */
    setSize: collection?.setSize,
    posInSet: (key) => {
      const position = collection?.posInSet(key);
      return position === undefined || position === -1 ? undefined : position;
    },
  };

  /* ── Rendering ──────────────────────────────────────────────────────── */

  const optionNode = (index: number, pinned: boolean) => {
    const held = collection?.options[index];
    if (held === undefined) return null;
    return (
      <ListboxOption
        key={held.key}
        value={held.key}
        textValue={held.label}
        {...(held.disabled ? { disabled: true } : {})}
        {...(pinned
          ? { pinned: true, style: { insetBlockStart: `${rowOffset(held.row)}px` } }
          : {})}
      >
        {renderOption?.(held.item)}
      </ListboxOption>
    );
  };

  const group = (key: string, label: string | undefined, content: ReactNode[]) => (
    <div key={`group-${key}`} aria-label={label} data-part="group" data-part-group="" role="group">
      {content}
    </div>
  );

  const renderCollection = (): ReactNode => {
    if (collection === undefined) return children;

    if (!windowed) {
      if (sections === undefined) {
        return collection.options.map((held) => optionNode(held.index, false));
      }
      return collection.sections.map((section) =>
        group(section.key, section.label, [
          <div key="label" data-part="group-label" data-part-group-label="">
            {section.label}
          </div>,
          ...collection.options
            .filter((held) => held.section === section.key)
            .map((held) => optionNode(held.index, false)),
        ]),
      );
    }

    /**
     * A windowed slice starts and ends in the middle of the collection, so a
     * group is emitted per contiguous run of rows belonging to one section
     * rather than per section. Each run is still a `group` carrying the
     * section's name, which is what the pattern asks of a grouped option:
     * contained in a group, and the group has an accessible name.
     */
    const nodes: ReactNode[] = [];
    let run: { key: string; label: string | undefined; content: ReactNode[] } | null = null;

    const flush = () => {
      if (run === null) return;
      nodes.push(group(`${run.key}-${slice.startIndex}`, run.label, run.content));
      run = null;
    };

    for (const row of collection.rows.slice(slice.startIndex, slice.endIndex)) {
      if (row.kind === 'section-label') {
        flush();
        run = { key: row.section.key, label: row.section.label, content: [] };
        run.content.push(
          <div key="label" data-part="group-label" data-part-group-label="">
            {row.section.label}
          </div>,
        );
        continue;
      }
      const held = row.option;
      if (held.section === undefined) {
        flush();
        nodes.push(optionNode(held.index, false));
        continue;
      }
      if (run === null || run.key !== held.section) {
        flush();
        run = {
          key: held.section,
          label: collection.sections.find((section) => section.key === held.section)?.label,
          content: [],
        };
      }
      run.content.push(optionNode(held.index, false));
    }
    flush();

    const pinned = [...slice.pinnedBefore, ...slice.pinnedAfter]
      .map((row) => collection.rows[row])
      .filter((row) => row !== undefined && row.kind === 'option')
      .map((row) => optionNode((row as { option: { index: number } }).option.index, true));

    return (
      <div
        data-part="canvas"
        data-part-canvas=""
        role="presentation"
        style={
          {
            '--_canvas-size': `${slice.totalSize}px`,
            '--_canvas-offset': `${slice.startOffset}px`,
          } as CSSProperties
        }
      >
        {pinned}
        {nodes}
      </div>
    );
  };

  const isEmpty = collection !== undefined && collection.options.length === 0;

  const rootProps: ListboxRootProps = keyedProps({
    ...nativeProps,
    'aria-activedescendant':
      mode === 'activedescendant' && active !== null ? `${idPrefix}${active}` : undefined,
    'aria-busy': loading === true ? true : undefined,
    'aria-describedby': field?.describedBy,
    'aria-disabled': isDisabled === true ? true : undefined,
    'aria-invalid': isInvalid === true ? true : undefined,
    'aria-multiselectable': resolved.selectionMode === 'multiple' ? true : undefined,
    'aria-orientation': resolved.orientation === 'horizontal' ? 'horizontal' : undefined,
    'aria-readonly': isReadOnly === true ? true : undefined,
    'aria-required': isRequired === true ? true : undefined,
    children: (
      <>
        {isEmpty && emptyContent !== undefined ? (
          <ListboxEmpty>{emptyContent}</ListboxEmpty>
        ) : (
          renderCollection()
        )}
        {hasMore === true && loaderContent !== undefined ? (
          <ListboxLoader>{loaderContent}</ListboxLoader>
        ) : null}
        {name === undefined
          ? null
          : selected.map((key) => <input key={key} name={name} type="hidden" value={key} />)}
      </>
    ),
    ...(isDisabled === true ? { 'data-disabled': '' } : {}),
    'data-focus-mode': mode,
    'data-indicator': resolved.indicator,
    ...(isInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolved.columns > 1 ? { 'data-layout': 'grid' as const } : {}),
    ...(loading === true ? { 'data-loading': '' } : {}),
    'data-orientation': resolved.orientation,
    'data-part': 'root',
    ...(isReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(isRequired === true ? { 'data-required': '' } : {}),
    'data-size': resolved.size,
    'data-ui': 'listbox',
    'data-variant': resolved.variant,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    role: 'listbox',
    style: {
      ...style,
      ...({
        '--slotted-listbox-rows': resolved.rows,
        '--slotted-listbox-columns': resolved.columns,
      } as CSSProperties),
    },
    /* One tab stop for the whole set. Under `roving` it lives on the active
       option once there is one, and on the root until then, so a listbox
       nobody has touched is still reachable with Tab. */
    tabIndex: mode === 'activedescendant' || active === null ? 0 : -1,
  });

  return (
    <ListboxContext.Provider value={context}>
      {render === undefined ? (
        <div
          {...rootProps}
          ref={(node) => {
            rootRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref !== null && ref !== undefined) ref.current = node;
          }}
        />
      ) : (
        render(rootProps)
      )}
    </ListboxContext.Provider>
  );
}
