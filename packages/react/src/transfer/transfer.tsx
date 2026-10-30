import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/transfer/transfer.css';

import { createFilter } from '@slotted/core/collection';
import { createDragController, type DragController } from '@slotted/core/drag';
import { dragMessages, transferMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable, type ChangeReason, type ChangeRequest } from '@slotted/core/state';
import {
  keysToMove,
  moveKeys,
  partitionKeys,
  reorderKeys,
  reorderKeysTo,
  toggleVisibleSelection,
  type TransferSide,
} from '@slotted/core/transfer';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { useField, useFieldDefaults } from '../field';
import { FieldContext } from '../field/field-context';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import {
  Listbox,
  ListboxDescription,
  ListboxIndicator,
  ListboxLabel,
  type ListboxHandle,
  type ListboxValue,
} from '../listbox';
import { Segment, SegmentedControl } from '../segmented-control';
import { TextField } from '../text-field';
import { useTransferDefaults } from './transfer-defaults';
import type {
  TransferItem,
  TransferMoveReason,
  TransferMoveRequest,
  TransferProps,
  TransferRootProps,
  TransferSelectionReason,
  TransferSize,
} from './transfer.types';

const SIDES: readonly TransferSide[] = ['source', 'target'];
const EMPTY: readonly string[] = [];

/* ── One value, two modes ──────────────────────────────────────────────── */

/**
 * The shared controllable, held across renders. It answers whether the
 * request went out uncancelled, which a controlled request does not say by
 * its return value: a move is announced when it is asked for, not when the
 * consumer's next render lands.
 */
function useModel<T, Extra extends object = Record<never, never>>(
  controlled: T | undefined,
  initial: T,
  onRequest: ((value: T, request: ChangeRequest<T> & Extra) => void) | undefined,
  equals: (a: T, b: T) => boolean = Object.is,
): [T, (next: T, reason: ChangeReason, source?: unknown, extra?: Extra) => boolean] {
  const [own, setOwn] = useState<T>(initial);
  const value = controlled === undefined ? own : controlled;
  const latest = useRef({ controlled, value, onRequest, equals });
  latest.current = { controlled, value, onRequest, equals };

  const request = useCallback((next: T, reason: ChangeReason, source?: unknown, extra?: Extra) => {
    const { controlled: owned, value: current, onRequest: ask, equals: same } = latest.current;
    if (same(current, next)) return false;
    let accepted = true;
    const model = createControllable<T>({
      controlled: owned,
      initial: current,
      equals: same,
      onRequest: (change) => {
        ask?.(change.value, Object.assign(change, extra ?? {}) as ChangeRequest<T> & Extra);
        accepted = !change.cancelled;
      },
    });
    if (model.request(next, reason, source)) {
      latest.current.value = next;
      setOwn(next);
    }
    return accepted;
  }, []);

  return [value, request];
}

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** An attribute value in a selector; `CSS.escape` where the platform has it. */
function escapeValue(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/["\\]/g, '\\$&');
}

function attach<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

const defaultGetKey = (item: unknown) => (item as TransferItem).key;
const defaultGetLabel = (item: unknown) => (item as TransferItem).label;
const defaultGetDescription = (item: unknown) => (item as TransferItem).description;
const defaultIsDisabled = (item: unknown) => (item as TransferItem).disabled === true;

/** The step one below the family's, for the search field and the buttons. */
const INNER_SIZE: Record<TransferSize, 'sm' | 'md'> = { sm: 'sm', md: 'sm', lg: 'md' };

/** One option of a pane: the item, or the key a target holds without one. */
interface Entry<T> {
  readonly key: string;
  readonly item: T | undefined;
}

interface DragView {
  readonly items: readonly string[];
  readonly over: TransferSide | null;
  readonly index: number | null;
  readonly from: TransferSide | null;
}

const NO_DRAG: DragView = { items: EMPTY, over: null, index: null, from: null };

export function Transfer<T = TransferItem>({
  items,
  getKey = defaultGetKey,
  getLabel = defaultGetLabel,
  getDescription = defaultGetDescription,
  isItemDisabled = defaultIsDisabled,
  renderItem,
  targetKeys: targetKeysProp,
  defaultTargetKeys,
  onTargetKeysChange,
  selectedKeys: selectedKeysProp,
  defaultSelectedKeys,
  onSelectedKeysChange,
  sourceQuery: sourceQueryProp,
  defaultSourceQuery,
  onSourceQueryChange,
  targetQuery: targetQueryProp,
  defaultTargetQuery,
  onTargetQueryChange,
  pane: paneProp,
  defaultPane,
  onPaneChange,
  filter,
  size: sizeProp,
  layout: layoutProp,
  searchable: searchableProp,
  selectAll: selectAllProp,
  reorderable: reorderableProp,
  rows: rowsProp,
  virtual,
  itemSize,
  overscan,
  disabled,
  readOnly,
  required,
  invalid,
  loading,
  hasMore,
  onLoadMore,
  name,
  messages,
  renderFooter,
  handleRef,
  render,
  ref,
  style,
  ...nativeProps
}: TransferProps<T>) {
  const defaults = useTransferDefaults();
  const field = useField();
  const fieldDefaults = useFieldDefaults();
  const t = useMessages(transferMessages, messages);
  const dragT = useMessages(dragMessages);

  const size = sizeProp ?? field?.size ?? defaults.size;
  const layout = layoutProp ?? defaults.layout;
  const searchable = searchableProp ?? defaults.searchable;
  const withSelectAll = selectAllProp ?? defaults.selectAll;
  const reorderable = reorderableProp ?? defaults.reorderable;
  const rows = rowsProp ?? defaults.rows;
  const isDisabled = disabled ?? field?.disabled ?? fieldDefaults.disabled ?? false;
  const isReadOnly = readOnly ?? field?.readOnly ?? fieldDefaults.readOnly ?? false;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isRequired = required ?? field?.required ?? false;
  const frozen = isDisabled || isReadOnly;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  const base = useId();
  const titleId = (side: TransferSide) => `${base}-${side}-title`;

  /* ── The four values ─────────────────────────────────────────────────── */

  const [targetKeys, requestTarget] = useModel<
    readonly string[],
    Pick<TransferMoveRequest, 'direction' | 'keys'>
  >(targetKeysProp, defaultTargetKeys ?? EMPTY, onTargetKeysChange as never, sameKeys);
  const [selectedKeys, requestSelected] = useModel<readonly string[]>(
    selectedKeysProp,
    defaultSelectedKeys ?? EMPTY,
    onSelectedKeysChange as never,
    sameKeys,
  );
  const [sourceQuery, requestSourceQuery] = useModel<string>(
    sourceQueryProp,
    defaultSourceQuery ?? '',
    onSourceQueryChange as never,
  );
  const [targetQuery, requestTargetQuery] = useModel<string>(
    targetQueryProp,
    defaultTargetQuery ?? '',
    onTargetQueryChange as never,
  );
  const [pane, requestPane] = useModel<TransferSide>(
    paneProp,
    defaultPane ?? 'source',
    onPaneChange as never,
  );

  /* ── What each pane draws ────────────────────────────────────────────── */

  const byKey = useMemo(() => new Map(items.map((item) => [getKey(item), item])), [items, getKey]);
  const allKeys = useMemo(() => items.map(getKey), [items, getKey]);
  const disabledKeys = useMemo(
    () => new Set(items.filter((item) => isItemDisabled(item)).map(getKey)),
    [items, isItemDisabled, getKey],
  );
  const partition = useMemo(
    () => partitionKeys(allKeys, targetKeys, reorderable),
    [allKeys, targetKeys, reorderable],
  );
  const matcher = useMemo(() => createFilter(), []);
  const query = { source: sourceQuery, target: targetQuery };

  const visibleOf = (side: TransferSide): readonly string[] => {
    const typed = query[side].trim();
    const keys = partition[side];
    if (typed === '') return keys;
    return keys.filter((key) => {
      const item = byKey.get(key);
      if (item === undefined) return matcher.contains(key, typed);
      if (filter) return filter(item, typed, side);
      return (
        matcher.contains(getLabel(item), typed) ||
        matcher.contains(getDescription(item) ?? '', typed)
      );
    });
  };
  const visible = { source: visibleOf('source'), target: visibleOf('target') };
  const selectedSet = new Set(selectedKeys);
  const enabledVisible = (side: TransferSide) =>
    visible[side].filter((key) => !disabledKeys.has(key));

  const labelOf = (key: string) => {
    const item = byKey.get(key);
    return item === undefined ? key : getLabel(item);
  };

  /* ── The lists ───────────────────────────────────────────────────────── */

  const listboxes = useRef<Record<TransferSide, ListboxHandle | null>>({
    source: null,
    target: null,
  });
  const lists = useRef<Record<TransferSide, HTMLDivElement | null>>({
    source: null,
    target: null,
  });
  const rootNode = useRef<HTMLDivElement | null>(null);
  const pendingFocus = useRef<TransferSide | null>(null);

  /**
   * Which option the keyboard is on in each list. The family holds it rather
   * than each listbox, because a move has to say where the keyboard goes next:
   * the APG example sends it to the first option after the moved ones that is
   * still in the list, and the listbox cannot know which of its options left
   * on purpose.
   */
  const [actives, setActives] = useState<Record<TransferSide, string | null>>({
    source: null,
    target: null,
  });
  const setActive = (side: TransferSide, key: string | null) =>
    setActives((current) => (current[side] === key ? current : { ...current, [side]: key }));

  /**
   * The option the keyboard is on: the option holding focus under the roving
   * model, where Tab lands on the tab stop without the listbox calling it
   * active, and the listbox's active option under `aria-activedescendant`,
   * where focus is on the listbox itself.
   */
  const activeIn = (side: TransferSide): string | null => {
    const list = lists.current[side];
    const focused = list?.ownerDocument.activeElement;
    if (list && focused instanceof HTMLElement && list.contains(focused)) {
      const key = focused.closest<HTMLElement>('[data-part="option"]')?.dataset['key'];
      if (key !== undefined) return key;
    }
    return listboxes.current[side]?.getActiveKey() ?? null;
  };

  const announce = (message: string) => {
    const document = rootNode.current?.ownerDocument;
    if (document && message !== '') getLiveAnnouncer(document).announce(message);
  };

  /* ── Requests ────────────────────────────────────────────────────────── */

  const move = (
    keys: readonly string[],
    to: TransferSide,
    reason: TransferMoveReason,
    event?: unknown,
    index?: number,
  ) => {
    if (frozen || keys.length === 0) return;
    const from: TransferSide = to === 'target' ? 'source' : 'target';
    const next = moveKeys({ allKeys, targetKeys, keys, to, reorderable, index });
    const moving = new Set(keys);
    const asked = requestTarget(next, reason, event, { direction: to, keys });
    if (!asked) return;
    requestSelected(
      selectedKeys.filter((key) => !moving.has(key)),
      reason,
      event,
    );
    const title = to === 'target' ? t('target') : t('source');
    announce(
      keys.length === 1
        ? t('movedOne', { item: labelOf(keys[0]!), pane: title })
        : t('moved', { count: keys.length, pane: title }),
    );
    const list = lists.current[from];
    if (!list?.contains(list.ownerDocument.activeElement)) return;
    /* The keyboard stays in the list it moved from, on the first option after
       the moved ones that is still there, then on the last one before them;
       a list left empty hands it to the other. */
    const shown = visible[from];
    const first = shown.findIndex((key) => moving.has(key));
    const after = first === -1 ? [] : shown.slice(first);
    const before = first === -1 ? shown : shown.slice(0, first);
    const stays = (key: string) => !moving.has(key) && !disabledKeys.has(key);
    const neighbour = after.find(stays) ?? [...before].reverse().find(stays) ?? null;
    if (neighbour === null) {
      pendingFocus.current = to;
      return;
    }
    setActive(from, neighbour);
    pendingFocus.current = from;
  };

  const reorder = (
    keys: readonly string[],
    next: readonly string[],
    reason: TransferMoveReason,
    event?: unknown,
  ) => {
    if (frozen || keys.length === 0 || sameKeys(next, partition.target)) return;
    const asked = requestTarget(next, reason, event, { direction: 'reorder', keys });
    if (!asked) return;
    announce(
      t('reordered', {
        item: labelOf(keys[0]!),
        position: next.indexOf(keys[0]!) + 1,
      }),
    );
    const list = lists.current.target;
    if (!list?.contains(list.ownerDocument.activeElement)) return;
    const held = activeIn('target');
    if (held !== null) setActive('target', held);
    pendingFocus.current = 'target';
  };

  const canReorder = reorderable && targetQuery.trim() === '';
  const shift = (
    delta: -1 | 1,
    reason: TransferMoveReason,
    event: unknown,
    withActive: boolean,
  ) => {
    if (!canReorder) return;
    const keys = keysToMove({
      visible: visible.target,
      selected: selectedKeys,
      disabled: disabledKeys,
      active: withActive ? activeIn('target') : null,
    });
    reorder(keys, reorderKeys(partition.target, keys, delta), reason, event);
  };

  const selectionFor = (side: TransferSide) => visible[side].filter((key) => selectedSet.has(key));

  const onPaneSelection = (
    side: TransferSide,
    value: ListboxValue,
    reason: ChangeReason,
    event: unknown,
  ) => {
    const chosen = Array.isArray(value) ? value : value === null ? [] : [value as string];
    const shown = new Set(visible[side]);
    const next = [...selectedKeys.filter((key) => !shown.has(key)), ...chosen];
    const mapped: TransferSelectionReason =
      reason === 'pointer' || reason === 'keyboard' || reason === 'programmatic'
        ? reason
        : 'select';
    requestSelected(next, mapped, event);
  };

  const onSelectAll = (side: TransferSide, checked: boolean, event: unknown) => {
    requestSelected(
      toggleVisibleSelection(selectedKeys, visible[side], disabledKeys, checked),
      'select',
      event,
    );
  };

  /* The keys the APG example gives a dual list, taken before the listbox's own. */
  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>, side: TransferSide) => {
    if (event.defaultPrevented || frozen) return;
    const other: TransferSide = side === 'source' ? 'target' : 'source';
    const pick = () =>
      keysToMove({
        visible: visible[side],
        selected: selectedKeys,
        disabled: disabledKeys,
        active: activeIn(side),
      });
    const modifier = event.ctrlKey || event.metaKey;
    const rtl =
      rootNode.current?.ownerDocument.defaultView?.getComputedStyle(rootNode.current).direction ===
      'rtl';
    const end = rtl ? 'ArrowLeft' : 'ArrowRight';
    const start = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === 'Enter' && !modifier && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      move(pick(), other, 'keyboard', event);
    } else if (side === 'target' && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      move(pick(), 'source', 'keyboard', event);
    } else if (modifier && !event.altKey && (event.key === end || event.key === start)) {
      const to: TransferSide = event.key === end ? 'target' : 'source';
      event.preventDefault();
      if (to !== side) move(pick(), to, 'keyboard', event);
    } else if (
      side === 'target' &&
      event.altKey &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      event.preventDefault();
      shift(event.key === 'ArrowUp' ? -1 : 1, 'keyboard', event, true);
    }
  };

  /* Focus follows the task: the list that emptied hands it to the other, and a
     reordered option keeps it after its element moved. */
  useLayoutEffect(() => {
    const side = pendingFocus.current;
    if (side === null) return;
    pendingFocus.current = null;
    listboxes.current[side]?.focus();
  });

  /* ── The handle ──────────────────────────────────────────────────────── */

  const latest = useRef({ partition });
  latest.current = { partition };
  useImperativeHandle(
    handleRef,
    () => ({
      focus: (side = 'source') => listboxes.current[side]?.focus(),
      scrollToKey: (key) => {
        const side: TransferSide = latest.current.partition.target.includes(key)
          ? 'target'
          : 'source';
        listboxes.current[side]?.scrollToKey(key);
      },
      get element() {
        return rootNode.current;
      },
    }),
    [],
  );

  /* ── The drag ────────────────────────────────────────────────────────── */

  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragView>(NO_DRAG);
  const [dropOffset, setDropOffset] = useState<number | null>(null);
  const controller = useRef<DragController | null>(null);
  const live = useRef({ visible, move, reorder, partition, frozen, canReorder, t, dragT, labelOf });
  live.current = { visible, move, reorder, partition, frozen, canReorder, t, dragT, labelOf };

  useEffect(() => {
    if (!root) return;
    const document = root.ownerDocument;
    const listOf = (side: TransferSide) =>
      root.querySelector<HTMLElement>(
        `[data-part="pane"][data-side="${side}"] [data-ui="listbox"]`,
      );
    const created = createDragController({
      document,
      preview: false,
      restoreFocus: false,
      autoScroll: { axis: 'y' },
      t: (key, slots) => live.current.dragT(key, slots),
      /* The move says what happened once, in the family's own words. */
      silent: ['moved', 'dropped'],
      onDrop: ({ items: carried, source, target, reason, event }) => {
        const now = live.current;
        const from = source.container as TransferSide;
        const to = target.container as TransferSide;
        const why: TransferMoveReason = reason === 'keyboard' ? 'keyboard' : 'pointer';
        const shown = now.visible.target;
        const full = now.partition.target;
        /* A splice index in what the target shows, as one in the whole target. */
        const indexInTarget = () => {
          if (target.kind !== 'between') return full.length;
          const anchor = shown[target.index];
          if (anchor !== undefined) return full.indexOf(anchor);
          const last = shown[shown.length - 1];
          return last === undefined ? full.length : full.indexOf(last) + 1;
        };
        if (from !== to) {
          now.move(carried, to, why, event, to === 'target' ? indexInTarget() : undefined);
        } else if (to === 'target') {
          now.reorder(carried, reorderKeysTo(full, carried, indexInTarget()), why, event);
        }
      },
    });
    const unregister = SIDES.map((side) =>
      created.registerContainer({
        key: side,
        items: () => live.current.visible[side],
        orientation: 'vertical',
        element: () => listOf(side),
        itemElement: (key) =>
          listOf(side)?.querySelector(`[data-part="option"][data-key="${escapeValue(key)}"]`) ??
          null,
        accepts: (state, target) => {
          if (state.source?.container !== target.container) return true;
          return target.container === 'target' && live.current.canReorder;
        },
        disabled: () => live.current.frozen,
        label: () => (side === 'target' ? live.current.t('target') : live.current.t('source')),
        itemLabel: (key) => live.current.labelOf(key),
      }),
    );
    /* The click the browser fires after a pointer drag is the drag's, not a
       press on the option: with the pointer captured it lands on the option
       that was carried and would toggle its selection. */
    let swallow = false;
    let wasDragging: 'pointer' | 'other' | null = null;
    const onClick = (event: Event) => {
      if (!swallow) return;
      swallow = false;
      event.preventDefault();
      event.stopPropagation();
    };
    root.addEventListener('click', onClick, true);
    const unsubscribe = created.subscribe((next) => {
      if (next.status !== 'dragging') {
        if (wasDragging === 'pointer') {
          swallow = true;
          window.setTimeout(() => {
            swallow = false;
          }, 0);
        }
        wasDragging = null;
        setDrag(NO_DRAG);
        return;
      }
      wasDragging = next.reason === 'pointer' ? 'pointer' : 'other';
      const target = next.target;
      setDrag({
        items: next.items,
        from: (next.source?.container as TransferSide | undefined) ?? null,
        over: target && next.valid ? (target.container as TransferSide) : null,
        index: target && target.kind === 'between' && next.valid ? target.index : null,
      });
    });
    controller.current = created;
    return () => {
      root.removeEventListener('click', onClick, true);
      unsubscribe();
      for (const off of unregister) off();
      created.destroy();
      controller.current = null;
      draggables.current.clear();
    };
  }, [root]);

  /* Every option is a draggable, and carries its pane's selection when it is in it. */
  const draggables = useRef(new Map<HTMLElement, () => void>());
  useEffect(() => {
    const created = controller.current;
    if (!created || !root) return;
    const seen = new Set<HTMLElement>();
    for (const side of SIDES) {
      const nodes = root.querySelectorAll<HTMLElement>(
        `[data-part="pane"][data-side="${side}"] [data-part="option"][data-key]`,
      );
      for (const node of nodes) {
        seen.add(node);
        if (draggables.current.has(node)) continue;
        const key = node.dataset['key']!;
        const detach = created.attachDraggable(node, {
          container: side,
          key,
          items: () => {
            const now = live.current;
            const carried = keysToMove({
              visible: now.visible[side],
              selected: selectedRef.current,
              disabled: disabledRef.current,
              active: null,
            });
            return carried.includes(key) ? carried : [key];
          },
          disabled: () => live.current.frozen || disabledRef.current.has(key),
          distance: 4,
        });
        draggables.current.set(node, detach);
      }
    }
    for (const [node, detach] of draggables.current) {
      if (seen.has(node)) continue;
      detach();
      draggables.current.delete(node);
    }
  });
  const selectedRef = useRef(selectedKeys);
  selectedRef.current = selectedKeys;
  const disabledRef = useRef(disabledKeys);
  disabledRef.current = disabledKeys;

  /* The drop line stands between two options, where script alone can measure. */
  const showsLine = drag.over === 'target' && drag.index !== null && reorderable;
  useLayoutEffect(() => {
    if (!showsLine || drag.index === null) {
      setDropOffset(null);
      return;
    }
    const list = lists.current.target;
    const listbox = list?.querySelector('[data-ui="listbox"]');
    if (!list || !listbox) return;
    const options = listbox.querySelectorAll<HTMLElement>('[data-part="option"]');
    const frame = list.getBoundingClientRect().top;
    const at = options[drag.index];
    const last = options[options.length - 1];
    const edge = at
      ? at.getBoundingClientRect().top
      : last
        ? last.getBoundingClientRect().bottom
        : listbox.getBoundingClientRect().top;
    setDropOffset(Math.round(edge - frame));
  }, [showsLine, drag.index]);

  const setRootNode = useCallback(
    (node: HTMLDivElement | null) => {
      rootNode.current = node;
      setRoot(node);
      attach(ref, node);
    },
    [ref],
  );

  /* ── Rendering ───────────────────────────────────────────────────────── */

  const innerSize = INNER_SIZE[size];
  const dragging = new Set(drag.items);
  const title = (side: TransferSide) => (side === 'target' ? t('target') : t('source'));

  const moveButton = (
    part: string,
    label: string,
    to: TransferSide,
    keys: readonly string[],
    glyphAt: 'start' | 'end',
    shortcut?: string,
  ) => {
    /* One chevron for a selection, two for everything; the stylesheet turns
       the box toward the side the items go. */
    const glyph = (
      <Icon>
        <Glyph name={part.startsWith('move-all') ? 'chevrons-right' : 'chevron-right'} />
      </Icon>
    );
    return (
      <Button
        {...(shortcut === undefined ? {} : { 'aria-keyshortcuts': shortcut })}
        disabled={frozen || keys.length === 0}
        focusableWhenDisabled={!isDisabled}
        onClick={(event) => move(keys, to, pressReason(event), event)}
        render={(props) => <button {...withSelectorKey(props, 'part', part)} />}
        size={innerSize}
        tone="secondary"
        variant="outline"
        {...(glyphAt === 'start' ? { start: glyph } : { end: glyph })}
      >
        {label}
      </Button>
    );
  };

  const selectedToMove = (side: TransferSide) =>
    keysToMove({
      visible: visible[side],
      selected: selectedKeys,
      disabled: disabledKeys,
      active: null,
    });
  const reorderKeysNow = selectedToMove('target');

  const renderPane = (side: TransferSide) => {
    const keys = partition[side];
    const shown = visible[side];
    const typed = query[side].trim() !== '';
    const reach = enabledVisible(side);
    const chosenHere = keys.filter((key) => selectedSet.has(key)).length;
    const chosenReach = reach.filter((key) => selectedSet.has(key)).length;
    const count = typed
      ? t('countFiltered', { shown: shown.length, total: keys.length })
      : chosenHere > 0
        ? t('countSelected', { selected: chosenHere, total: keys.length })
        : t('count', { total: keys.length });
    const entries: Entry<T>[] = shown.map((key) => ({ key, item: byKey.get(key) }));
    const setQuery = side === 'source' ? requestSourceQuery : requestTargetQuery;
    const footer = renderFooter?.(side);

    return (
      <div
        aria-labelledby={titleId(side)}
        data-part="pane"
        data-part-pane=""
        data-side={side}
        role="group"
        {...(pane === side ? { 'data-current': '' } : {})}
        {...(drag.over === side && (drag.from !== side || side === 'target')
          ? { 'data-drop-target': '' }
          : {})}
      >
        <div data-part="pane-header" data-part-pane-header="">
          {withSelectAll ? (
            <span data-part="select-all" data-part-select-all="">
              <Checkbox
                aria-label={t('selectAll', { pane: title(side) })}
                checked={reach.length > 0 && chosenReach === reach.length}
                disabled={isDisabled || reach.length === 0}
                indeterminate={chosenReach > 0 && chosenReach < reach.length}
                onCheckedChange={(checked, request) => onSelectAll(side, checked, request.source)}
                size={size}
              />
            </span>
          ) : null}
          <span data-part="title" data-part-title="" id={titleId(side)}>
            {title(side)}
          </span>
          <span data-part="count" data-part-count="">
            {count}
          </span>
        </div>
        {searchable ? (
          <div data-part="search" data-part-search="">
            <TextField
              aria-label={t('search', { pane: title(side) })}
              clearable
              disabled={isDisabled}
              onValueChange={(next, request) =>
                setQuery(next, request.reason === 'clear' ? 'clear' : 'keyboard', request.source)
              }
              placeholder={t('search', { pane: title(side) })}
              size={innerSize}
              start={
                <span data-part="search-icon" data-part-search-icon="">
                  <Icon>
                    <Glyph name="search" />
                  </Icon>
                </span>
              }
              type="search"
              value={query[side]}
            />
          </div>
        ) : null}
        <div
          data-part="list"
          data-part-list=""
          onFocusCapture={(event) => {
            /* Tab lands on the option holding the tab stop, and the keyboard
               is on it from then on. */
            const key = (event.target as HTMLElement).closest<HTMLElement>('[data-part="option"]')
              ?.dataset['key'];
            if (key !== undefined) setActive(side, key);
          }}
          onKeyDownCapture={(event) => onListKeyDown(event, side)}
          ref={(node) => {
            lists.current[side] = node;
          }}
        >
          <Listbox<Entry<T>>
            activeKey={
              /* A key that left the list is no tab stop: the list would be
                 unreachable by Tab. */
              actives[side] !== null && shown.includes(actives[side]) ? actives[side] : null
            }
            aria-labelledby={titleId(side)}
            disabled={isDisabled}
            emptyContent={
              <div data-part="empty" data-part-empty="" {...(typed ? { 'data-query': '' } : {})}>
                <Icon>
                  <Glyph name={typed ? 'search-x' : 'inbox'} />
                </Icon>
                {typed ? t('noResults') : t('empty')}
              </div>
            }
            getKey={(entry) => entry.key}
            getLabel={(entry) => (entry.item === undefined ? entry.key : getLabel(entry.item))}
            handleRef={(handle: ListboxHandle | null) => {
              listboxes.current[side] = handle;
            }}
            invalid={isInvalid}
            isItemDisabled={(entry) => entry.item !== undefined && isItemDisabled(entry.item)}
            items={entries}
            onActiveKeyChange={(key) => setActive(side, key)}
            onValueChange={(value, request) =>
              onPaneSelection(side, value, request.reason, request.source)
            }
            renderOption={(entry) => {
              const marks = {
                ...(dragging.has(entry.key) ? { 'data-dragging': '' } : {}),
                ...(entry.item === undefined ? { 'data-unresolved': '' } : {}),
              };
              if (entry.item === undefined) {
                return (
                  <>
                    <ListboxIndicator {...marks} />
                    <ListboxLabel>{entry.key}</ListboxLabel>
                  </>
                );
              }
              const description = getDescription(entry.item);
              return (
                <>
                  <ListboxIndicator {...marks} />
                  {renderItem ? (
                    renderItem(entry.item, { side, resolved: true })
                  ) : (
                    <>
                      <ListboxLabel>{getLabel(entry.item)}</ListboxLabel>
                      {description ? <ListboxDescription>{description}</ListboxDescription> : null}
                    </>
                  )}
                </>
              );
            }}
            required={isRequired}
            rows={rows}
            selectionMode="multiple"
            size={size}
            value={selectionFor(side)}
            variant="plain"
            {...(virtual === true && itemSize !== undefined ? { virtual: true, itemSize } : {})}
            {...(overscan === undefined ? {} : { overscan })}
            {...(side === 'source'
              ? {
                  loading: loading === true,
                  hasMore: hasMore === true,
                  ...(onLoadMore === undefined ? {} : { onLoadMore }),
                  loaderContent: t('loading'),
                }
              : {})}
          />
          {side === 'target' && showsLine && dropOffset !== null ? (
            <div
              aria-hidden="true"
              data-part="drop-indicator"
              data-part-drop-indicator=""
              style={{ '--_drop-offset': `${dropOffset}px` } as CSSProperties}
            />
          ) : null}
        </div>
        {footer === undefined || footer === null ? null : (
          <div data-part="pane-footer" data-part-pane-footer="">
            {footer}
          </div>
        )}
      </div>
    );
  };

  const rootProps: TransferRootProps = keyedProps({
    ...nativeProps,
    ...(nativeProps['aria-label'] === undefined &&
    nativeProps['aria-labelledby'] === undefined &&
    field !== undefined
      ? { 'aria-labelledby': field.ids.label }
      : {}),
    ...(field?.describedBy === undefined || nativeProps['aria-describedby'] !== undefined
      ? {}
      : { 'aria-describedby': field.describedBy }),
    ...(isDisabled ? { 'aria-disabled': true, 'data-disabled': '' } : {}),
    ...(isInvalid ? { 'data-invalid': '' } : {}),
    ...(isReadOnly ? { 'data-readonly': '' } : {}),
    ...(isRequired ? { 'data-required': '' } : {}),
    ...(loading === true ? { 'data-loading': '' } : {}),
    'data-layout': layout,
    'data-pane': pane,
    'data-part': 'root',
    'data-size': size,
    'data-ui': 'transfer',
    ref: setRootNode,
    role: 'group',
    style: { ...style, '--slotted-transfer-rows': rows } as CSSProperties,
    children: (
      /* The composed families are this family's parts, not the field's
         control: the field wires the root, and a listbox that read it too
         would take its label and its disabled state a second time. */
      <FieldContext.Provider value={undefined}>
        <div data-part="switch" data-part-switch="">
          <SegmentedControl
            aria-label={t('panes')}
            disabled={isDisabled}
            fullWidth
            onValueChange={(next, request) =>
              requestPane(
                next as TransferSide,
                request.reason === 'keyboard' ? 'keyboard' : 'pointer',
                request.source,
              )
            }
            size={size}
            value={pane}
          >
            {SIDES.map((side) => (
              <Segment key={side} value={side}>
                {t('paneCount', { pane: title(side), total: partition[side].length })}
              </Segment>
            ))}
          </SegmentedControl>
        </div>
        <div data-part="body" data-part-body="">
          {renderPane('source')}
          <div aria-label={t('actions')} data-part="actions" data-part-actions="" role="group">
            {moveButton(
              'move-to-target',
              t('moveToTarget'),
              'target',
              selectedToMove('source'),
              'end',
              'Enter',
            )}
            {moveButton(
              'move-all-to-target',
              t('moveAllToTarget'),
              'target',
              enabledVisible('source'),
              'end',
            )}
            {moveButton(
              'move-to-source',
              t('moveToSource'),
              'source',
              selectedToMove('target'),
              'start',
              'Delete',
            )}
            {moveButton(
              'move-all-to-source',
              t('moveAllToSource'),
              'source',
              enabledVisible('target'),
              'start',
            )}
            {reorderable ? (
              <div aria-label={t('reorder')} data-part="reorder" data-part-reorder="" role="group">
                {(['move-up', 'move-down'] as const).map((part) => (
                  <Button
                    aria-keyshortcuts={part === 'move-up' ? 'Alt+ArrowUp' : 'Alt+ArrowDown'}
                    disabled={frozen || !canReorder || reorderKeysNow.length === 0}
                    focusableWhenDisabled={!isDisabled}
                    key={part}
                    onClick={(event) =>
                      shift(part === 'move-up' ? -1 : 1, pressReason(event), event, false)
                    }
                    render={(props) => <button {...withSelectorKey(props, 'part', part)} />}
                    size={innerSize}
                    start={
                      /* One chevron for both; the stylesheet turns it up for
                         move-up. */
                      <Icon>
                        <Glyph name="chevron-down" />
                      </Icon>
                    }
                    tone="secondary"
                    variant="ghost"
                  >
                    {part === 'move-up' ? t('moveUp') : t('moveDown')}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          {renderPane('target')}
        </div>
        {name === undefined
          ? null
          : partition.target.map((key) => (
              <input key={key} name={name} type="hidden" value={key} />
            ))}
      </FieldContext.Provider>
    ),
  });

  if (render !== undefined) return render(rootProps) as ReactNode;
  return <div {...rootProps} />;
}
