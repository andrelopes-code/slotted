import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/column-manager/column-manager.css';

import { createDragController, type DragController, type DragState } from '@slotted/core/drag';
import {
  columnStateChanges,
  normalizeColumnState,
  withColumnHidden,
  withColumnMoved,
  withColumnPinned,
  type GridColumn,
  type GridColumnState,
  type GridPinZone,
} from '@slotted/core/grid';
import {
  columnManagerMessages,
  dragMessages,
  type ColumnManagerMessages,
  type FamilyTranslator,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable, type ChangeReason, type ChangeRequest } from '@slotted/core/state';
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Drawer, DrawerPanel, useDrawer } from '../drawer';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import { Popover, PopoverContent, PopoverLayer, usePopover } from '../popover';
import { TextField } from '../text-field';
import { VisuallyHidden } from '../visually-hidden';
import { useColumnManagerDefaults } from './column-manager-defaults';
import type {
  ColumnManagerColumnReason,
  ColumnManagerHandle,
  ColumnManagerOpenReason,
  ColumnManagerProps,
  ColumnManagerRequest,
  ColumnManagerTriggerProps,
  ColumnManagerTriggerRootProps,
} from './column-manager.types';

/* ── Pure reading of the state ─────────────────────────────────────────── */

type ZoneKey = 'start' | 'middle' | 'end';
const ZONE_KEYS: readonly ZoneKey[] = ['start', 'middle', 'end'];

/** The three pin zones over the normalized order, every column in one of them. */
export function columnZones(state: GridColumnState): Record<ZoneKey, readonly string[]> {
  const start = state.pinned.start.filter((id) => state.order.includes(id));
  const end = state.pinned.end.filter((id) => state.order.includes(id));
  const middle = state.order.filter((id) => !start.includes(id) && !end.includes(id));
  return { start, middle, end };
}

/** Case and accents fall away, so `Crème` is found by `creme`. */
export function searchKey(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function sameState(a: GridColumnState, b: GridColumnState): boolean {
  return columnStateChanges(a, b).length === 0;
}

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

function zoneOfKey(key: ZoneKey): GridPinZone {
  return key === 'middle' ? null : key;
}

/* ── The channel between a manager and its trigger ─────────────────────── */

interface TriggerSnapshot {
  readonly open: boolean;
  readonly hidden: number;
  readonly rootId: string;
  /** The manager's words, so the trigger names the hidden count in its language. */
  readonly t: FamilyTranslator<ColumnManagerMessages>;
}

/**
 * What a trigger reads and asks, held outside React so a trigger rendered
 * anywhere — before the manager, in a toolbar, through a ref — subscribes to
 * one value rather than to the manager's render.
 */
class TriggerChannel {
  private listeners = new Set<() => void>();
  snapshot: TriggerSnapshot;
  toggle: (reason: ColumnManagerOpenReason, event: unknown) => void = () => undefined;
  onTrigger: (node: HTMLElement | null) => void = () => undefined;

  constructor(snapshot: TriggerSnapshot) {
    this.snapshot = snapshot;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get = () => this.snapshot;

  publish(next: TriggerSnapshot) {
    const current = this.snapshot;
    if (
      current.open === next.open &&
      current.hidden === next.hidden &&
      current.rootId === next.rootId &&
      current.t === next.t
    ) {
      return;
    }
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
}

/** Handle → channel, so the public handle carries nothing private. */
const CHANNELS = new WeakMap<ColumnManagerHandle, TriggerChannel>();

interface RootContextValue {
  channel: TriggerChannel | null;
  setChannel: (channel: TriggerChannel | null) => void;
}

const ColumnManagerRootContext = createContext<RootContextValue | null>(null);

/**
 * Optional: a manager and a trigger written inside one root find each other
 * without a ref. A trigger given `manager` does not need it.
 */
export function ColumnManagerRoot({ children }: { children?: ReactNode }) {
  const [channel, setChannel] = useState<TriggerChannel | null>(null);
  const value = useMemo(() => ({ channel, setChannel }), [channel]);
  return (
    <ColumnManagerRootContext.Provider value={value}>{children}</ColumnManagerRootContext.Provider>
  );
}

/* ── One value, two modes ──────────────────────────────────────────────── */

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
    const model = createControllable<T>({
      controlled: owned,
      initial: current,
      equals: same,
      onRequest: (change) =>
        ask?.(change.value, Object.assign(change, extra ?? {}) as ChangeRequest<T> & Extra),
    });
    const moved = model.request(next, reason, source);
    if (moved) setOwn(next);
    return moved;
  }, []);

  return [value, request];
}

/* ── The bridges into the layer families ───────────────────────────────── */

/**
 * The trigger is this family's, not the popover's, so the popover is told
 * which element it hangs from and which press is not an outside press.
 */
function PopoverBridge({ trigger }: { trigger: HTMLElement | null }) {
  const { setTriggerNode } = usePopover();
  useLayoutEffect(() => {
    setTriggerNode(trigger);
    return () => setTriggerNode(null);
  }, [setTriggerNode, trigger]);
  return null;
}

/**
 * The drawer takes its scheme, density and direction from its trigger's
 * region. `nodes` is the drawer's one stable record of its elements, written
 * by its own trigger part; this family's trigger stands in for that part.
 */
function DrawerBridge({ trigger }: { trigger: HTMLElement | null }) {
  const drawer = useDrawer();
  useLayoutEffect(() => {
    drawer.nodes.trigger = trigger;
  }, [drawer.nodes, trigger]);
  return null;
}

/* ── The manager ───────────────────────────────────────────────────────── */

interface DragView {
  dragging: string | null;
  container: ZoneKey | null;
  index: number | null;
}

const NO_DRAG: DragView = { dragging: null, container: null, index: null };

function attach<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

export function ColumnManager<Row = unknown>({
  apply: applyProp,
  columnState: columnStateProp,
  columns,
  defaultColumnState,
  defaultOpen,
  messages,
  onColumnStateChange,
  onOpenChange,
  open: openProp,
  outOfSpace,
  presentation: presentationProp,
  ref,
  ...nativeProps
}: ColumnManagerProps<Row>) {
  const defaults = useColumnManagerDefaults();
  const presentation = presentationProp ?? defaults.presentation;
  const applyMode = applyProp ?? defaults.apply;
  const t = useMessages(columnManagerMessages, messages);

  const base = useId();
  const rootId = `${base}-panel`;
  const titleId = `${base}-title`;

  const normalizedDefault = useMemo(
    () => normalizeColumnState(defaultColumnState, columns),
    [defaultColumnState, columns],
  );
  const normalizedControlled = useMemo(
    () =>
      columnStateProp === undefined ? undefined : normalizeColumnState(columnStateProp, columns),
    [columnStateProp, columns],
  );
  const [ownState, requestState] = useModel<
    GridColumnState,
    Pick<ColumnManagerRequest, 'change' | 'changes'>
  >(normalizedControlled, normalizedDefault, onColumnStateChange as never, sameState);
  const state = useMemo(() => normalizeColumnState(ownState, columns), [ownState, columns]);

  const [open, requestOpen] = useModel<boolean>(
    openProp,
    defaultOpen ?? false,
    onOpenChange as ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined,
  );

  /* Under confirm, every action edits a draft read from the state. */
  const [draft, setDraft] = useState<GridColumnState | null>(null);
  const confirm = applyMode === 'confirm';
  const working = confirm && draft !== null ? draft : state;

  const [query, setQuery] = useState('');
  const searchText = searchKey(query.trim());
  const searching = searchText !== '';

  const byId = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);
  const zones = useMemo(() => columnZones(working), [working]);
  const hidden = useMemo(() => new Set(working.hidden), [working.hidden]);
  const spaceHidden = useMemo(() => new Set(outOfSpace?.hidden ?? []), [outOfSpace]);
  const inRow = useMemo(() => new Set(outOfSpace?.popin ?? []), [outOfSpace]);
  const total = working.order.length;
  const visible = total - working.order.filter((id) => hidden.has(id)).length;

  const matches = useCallback(
    (id: string) => {
      if (!searching) return true;
      const column = byId.get(id);
      if (!column) return false;
      return (
        searchKey(column.label).includes(searchText) ||
        searchKey(column.description ?? '').includes(searchText)
      );
    },
    [byId, searchText, searching],
  );

  /* ── Requests ─────────────────────────────────────────────────────────── */

  const emit = useCallback(
    (next: GridColumnState, reason: ColumnManagerColumnReason, source?: unknown) => {
      const changes = columnStateChanges(state, next);
      if (changes.length === 0) return false;
      return requestState(next, reason, source, { change: changes[0]!, changes });
    },
    [requestState, state],
  );

  const edit = useCallback(
    (next: GridColumnState, reason: ColumnManagerColumnReason, source?: unknown) => {
      if (confirm) setDraft(next);
      else emit(next, reason, source);
    },
    [confirm, emit],
  );

  const setOpen = useCallback(
    (next: boolean, reason: ColumnManagerOpenReason, source?: unknown) => {
      /* The draft and the search go when the layer does, not when a close is
         only asked: a controlled consumer may refuse it. */
      return requestOpen(next, reason, source);
    },
    [requestOpen],
  );

  /* A draft is read when the layer opens, and dropped when it closes. */
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current && confirm) setDraft(state);
    if (!open && wasOpen.current) {
      setDraft(null);
      setQuery('');
    }
    wasOpen.current = open;
  }, [open, confirm, state]);

  const onApply = (event: MouseEvent) => {
    if (draft !== null) emit(draft, 'submit', event);
    setDraft(null);
    if (presentation !== 'inline') setOpen(false, pressReason(event), event);
  };

  const onCancel = (event: MouseEvent) => {
    setDraft(null);
    if (presentation !== 'inline') setOpen(false, pressReason(event), event);
  };

  /* ── The trigger ─────────────────────────────────────────────────────── */

  const [channel] = useState(() => new TriggerChannel({ open: false, hidden: 0, rootId, t }));
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  channel.onTrigger = setTriggerNode;
  channel.toggle = (reason, event) => setOpen(!open, reason, event);
  useLayoutEffect(() => {
    channel.publish({
      open,
      hidden: state.hidden.length,
      rootId: nativeProps.id ?? rootId,
      t,
    });
  });
  const root = useContext(ColumnManagerRootContext);
  const setRootChannel = root?.setChannel;
  useLayoutEffect(() => {
    setRootChannel?.(channel);
    return () => setRootChannel?.(null);
  }, [channel, setRootChannel]);

  /* ── The handle ──────────────────────────────────────────────────────── */

  const rootNode = useRef<HTMLDivElement | null>(null);
  const latestOpen = useRef({ open, setOpen });
  latestOpen.current = { open, setOpen };
  const [handle] = useState<ColumnManagerHandle>(() => ({
    show: () => latestOpen.current.setOpen(true, 'programmatic'),
    hide: () => latestOpen.current.setOpen(false, 'programmatic'),
    toggle: () => latestOpen.current.setOpen(!latestOpen.current.open, 'programmatic'),
    get element() {
      return rootNode.current;
    },
  }));
  CHANNELS.set(handle, channel);
  useImperativeHandle(ref, () => handle, [handle]);

  /* ── The drag ────────────────────────────────────────────────────────── */

  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const setRoot = useCallback((node: HTMLDivElement | null) => {
    rootNode.current = node;
    setPanel(node);
  }, []);
  const [drag, setDrag] = useState<DragView>(NO_DRAG);
  const controller = useRef<DragController | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const dragT = useMessages(dragMessages);
  const latest = useRef({ zones, working, edit, searching, byId, t, dragT });
  latest.current = { zones, working, edit, searching, byId, t, dragT };

  useEffect(() => {
    if (!panel) return;
    const document = panel.ownerDocument;
    const announce = (message: string) => {
      if (message !== '') getLiveAnnouncer(document).announce(message);
    };
    const itemOf = (id: string) =>
      panel.querySelector<HTMLElement>(`[data-part="item"][data-column="${escapeValue(id)}"]`);
    const created = createDragController({
      document,
      preview: false,
      restoreFocus: false,
      autoScroll: { axis: 'y' },
      announce,
      t: (key, slots) => latest.current.dragT(key, slots),
      /* A one-step keyboard move says where the column landed once, below;
         the controller's own step-by-step position would say it twice. */
      silent: ['moved'],
      onDrop: ({ items, source, target, reason, event }) => {
        if (target.kind !== 'between' || target.container !== source.container) return;
        const { zones: current, working: from, edit: request, t: words } = latest.current;
        const key = source.container as ZoneKey;
        const zone = current[key];
        const id = items[0]!;
        const to = target.index > source.index ? target.index - 1 : target.index;
        request(
          withColumnMoved(from, id, to, zone),
          reason === 'keyboard' ? 'keyboard' : 'pointer',
          event,
        );
        if (reason === 'keyboard') {
          pendingFocus.current = id;
          const column = latest.current.byId.get(id);
          announce(words('moved', { column: column?.label ?? id, position: to + 1 }));
        }
      },
    });
    const unregister = ZONE_KEYS.map((key) =>
      created.registerContainer({
        key,
        items: () => latest.current.zones[key],
        orientation: 'vertical',
        element: () => panel.querySelector(`[data-part="section"][data-zone="${key}"]`),
        itemElement: itemOf,
        accepts: (dragState: DragState, target) => dragState.source?.container === target.container,
        disabled: () => latest.current.searching,
        itemLabel: (id) => latest.current.byId.get(id)?.label ?? id,
      }),
    );
    const unsubscribe = created.subscribe((next) => {
      if (next.status !== 'dragging' || next.reason === 'keyboard') {
        setDrag(NO_DRAG);
        return;
      }
      const target = next.target;
      setDrag({
        dragging: next.items[0] ?? null,
        container: target && target.kind === 'between' ? (target.container as ZoneKey) : null,
        index: target && target.kind === 'between' && next.valid ? target.index : null,
      });
    });
    controller.current = created;
    return () => {
      unsubscribe();
      for (const off of unregister) off();
      created.destroy();
      controller.current = null;
      draggables.current.clear();
    };
  }, [panel]);

  /* Every item is a draggable whose press must start on its handle. */
  const draggables = useRef(new Map<string, { node: HTMLElement; detach: () => void }>());
  useEffect(() => {
    const created = controller.current;
    if (!created || !panel) return;
    const seen = new Set<string>();
    for (const node of panel.querySelectorAll<HTMLElement>('[data-part="item"][data-column]')) {
      const id = node.dataset['column']!;
      const key = node.closest<HTMLElement>('[data-part="section"]')?.dataset['zone'] ?? 'middle';
      seen.add(id);
      const existing = draggables.current.get(id);
      if (existing && existing.node === node && existing.node.dataset['attachedZone'] === key)
        continue;
      existing?.detach();
      node.dataset['attachedZone'] = key;
      const detach = created.attachDraggable(node, {
        container: key,
        key: id,
        handle: () => node.querySelector('[data-part="handle"]'),
        disabled: () =>
          latest.current.searching || latest.current.byId.get(id)?.reorderable === false,
        distance: 4,
      });
      draggables.current.set(id, { node, detach });
    }
    for (const [id, entry] of draggables.current) {
      if (seen.has(id)) continue;
      entry.detach();
      draggables.current.delete(id);
    }
  });

  /* Focus stays on the handle of a column the keyboard moved. */
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id || !panel) return;
    pendingFocus.current = null;
    panel
      .querySelector<HTMLElement>(
        `[data-part="item"][data-column="${escapeValue(id)}"] > [data-part="handle"]`,
      )
      ?.focus();
  });

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string, key: ZoneKey) => {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (searching || byId.get(id)?.reorderable === false) return;
    const zone = zones[key];
    const index = zone.indexOf(id);
    const up = event.key === 'ArrowUp';
    if ((up && index <= 0) || (!up && index >= zone.length - 1)) return;
    controller.current?.moveBy({
      items: [id],
      source: { container: key, index },
      intent: up ? 'previous' : 'next',
      reason: 'keyboard',
      event: event.nativeEvent,
    });
  };

  /* ── The panel ───────────────────────────────────────────────────────── */

  const sections = ZONE_KEYS.map((key) => ({
    key,
    ids: zones[key].filter((id) => byId.has(id) && matches(id)),
  })).filter((section) => section.ids.length > 0);
  const sectionLabel = {
    start: t('pinnedStart'),
    middle: t('unpinned'),
    end: t('pinnedEnd'),
  };

  const renderItem = (id: string, key: ZoneKey) => {
    const column = byId.get(id) as GridColumn<Row>;
    const isHidden = hidden.has(id);
    const locked = column.hideable === false;
    const lastVisible = !isHidden && visible <= 1;
    const bySpace = !isHidden && spaceHidden.has(id);
    const shownInRow = !isHidden && inRow.has(id);
    const handleDisabled = searching || column.reorderable === false;
    const status = locked
      ? t('required')
      : bySpace
        ? t('hiddenBySpace')
        : shownInRow
          ? t('inRow')
          : null;
    const zone = zoneOfKey(key);
    return (
      <div
        data-column={id}
        data-part="item"
        data-part-item=""
        {...(isHidden ? { 'data-hidden': '' } : {})}
        {...(locked ? { 'data-locked': '' } : {})}
        {...(bySpace ? { 'data-space-hidden': '' } : {})}
        {...(zone ? { 'data-pinned': zone } : {})}
        {...(drag.dragging === id ? { 'data-dragging': '' } : {})}
      >
        <button
          aria-disabled={handleDisabled || undefined}
          aria-label={t('reorder', { column: column.label })}
          data-part="handle"
          data-part-handle=""
          onKeyDown={(event) => onHandleKeyDown(event, id, key)}
          type="button"
          {...(handleDisabled ? { 'data-disabled': '' } : {})}
        >
          <Icon size="sm">
            <Glyph name="grip-vertical" />
          </Icon>
        </button>
        <div data-part="visibility" data-part-visibility="">
          <Checkbox
            checked={!isHidden}
            description={column.description}
            disabled={(locked && !isHidden) || lastVisible}
            onCheckedChange={(checked, request) =>
              edit(
                withColumnHidden(working, id, !checked),
                request.reason === 'keyboard' ? 'keyboard' : 'pointer',
                request.source,
              )
            }
          >
            {column.label}
            {status === null ? null : (
              <>
                {' '}
                <span data-part="status" data-part-status="">
                  {status}
                </span>
              </>
            )}
          </Checkbox>
        </div>
        <Menu size="sm">
          <MenuTrigger
            render={(props) => (
              <button
                {...withSelectorKey(props, 'part', 'pin')}
                aria-label={t('pin', { column: column.label })}

                type="button"
                {...(zone ? { 'data-pinned': '' } : {})}
              >
                <Icon size="sm">
                  <Glyph name="pin" />
                </Icon>
              </button>
            )}
          />
          <MenuContent>
            <MenuItem
              disabled={zone === 'start'}
              onSelect={(event) =>
                edit(withColumnPinned(working, id, 'start'), event.reason, event.source)
              }
            >
              {t('pinStart')}
            </MenuItem>
            <MenuItem
              disabled={zone === 'end'}
              onSelect={(event) =>
                edit(withColumnPinned(working, id, 'end'), event.reason, event.source)
              }
            >
              {t('pinEnd')}
            </MenuItem>
            {zone === null ? null : (
              <MenuItem
                onSelect={(event) =>
                  edit(withColumnPinned(working, id, null), event.reason, event.source)
                }
              >
                {t('unpin')}
              </MenuItem>
            )}
          </MenuContent>
        </Menu>
      </div>
    );
  };

  const dropAt = (key: ZoneKey, index: number) => {
    if (drag.container !== key || drag.index !== index || drag.dragging === null) return false;
    const from = zones[key].indexOf(drag.dragging);
    return index !== from && index !== from + 1;
  };

  const panelNode = (
    <div
      {...withSelectorKey(nativeProps, 'part', 'root')}
      aria-labelledby={nativeProps['aria-labelledby'] ?? titleId}
      data-apply={applyMode}

      data-presentation={presentation}
      data-ui="column-manager"
      data-ui-column-manager=""
      id={nativeProps.id ?? rootId}
      ref={setRoot}
      role="group"
    >
      <div data-part="header" data-part-header="">
        <h2 data-part="title" data-part-title="" id={titleId}>
          {t('title')}
        </h2>
        <span data-part="summary" data-part-summary="">
          {t('visibleCount', { visible, total })}
        </span>
      </div>
      <div data-part="search" data-part-search="">
        <TextField
          aria-label={t('search')}
          clearable
          onValueChange={(next) => setQuery(next)}
          placeholder={t('search')}
          size="sm"
          start={
            <Icon>
              <Glyph name="search" />
            </Icon>
          }
          type="search"
          value={query}
        />
      </div>
      <div data-part="list" data-part-list="">
        {sections.length === 0 && searching ? (
          <div data-part="empty" data-part-empty="" role="status">
            {t('noResults')}
          </div>
        ) : (
          sections.map(({ key, ids }) => (
            <div
              aria-labelledby={`${base}-${key}`}
              data-part="section"
              data-part-section=""
              data-zone={key}
              key={key}
              role="group"
              {...(sections.length === 1 ? { 'data-sole': '' } : {})}
              {...(drag.container === key && drag.index !== null ? { 'data-drop-target': '' } : {})}
            >
              <div data-part="section-label" data-part-section-label="" id={`${base}-${key}`}>
                {sectionLabel[key]}
              </div>
              {ids.map((id, index) => (
                <Fragment key={id}>
                  {dropAt(key, zones[key].indexOf(id)) ? (
                    <div
                      aria-hidden="true"
                      data-part="drop-indicator"
                      data-part-drop-indicator=""
                    />
                  ) : null}
                  {renderItem(id, key)}
                  {index === ids.length - 1 && dropAt(key, zones[key].length) ? (
                    <div
                      aria-hidden="true"
                      data-part="drop-indicator"
                      data-part-drop-indicator=""
                    />
                  ) : null}
                </Fragment>
              ))}
            </div>
          ))
        )}
      </div>
      <div data-part="footer" data-part-footer="">
        <Button
          disabled={working.hidden.length === 0}
          onClick={(event) => edit({ ...working, hidden: [] }, pressReason(event), event)}
          render={(props) => <button {...withSelectorKey(props, 'part', 'show-all')} />}
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          {t('showAll')}
        </Button>
        <Button
          disabled={sameState(working, normalizedDefault)}
          onClick={(event) => edit(normalizedDefault, 'clear', event)}
          render={(props) => <button {...withSelectorKey(props, 'part', 'reset')} />}
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          {t('reset')}
        </Button>
        {confirm ? (
          <>
            <Button
              onClick={onCancel}
              render={(props) => <button {...withSelectorKey(props, 'part', 'cancel')} />}
              size="sm"
              tone="secondary"
              variant="outline"
            >
              {t('cancel')}
            </Button>
            <Button
              disabled={draft === null || sameState(draft, state)}
              onClick={onApply}
              render={(props) => <button {...withSelectorKey(props, 'part', 'apply')} />}
              size="sm"
            >
              {t('apply')}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );

  const onLayerChange = (next: boolean, request: ChangeRequest<boolean>) => {
    setOpen(next, request.reason as ColumnManagerOpenReason, request.source);
  };

  if (presentation === 'inline') {
    /* In place, the draft is always open: Apply and Cancel settle it. */
    return panelNode;
  }

  if (presentation === 'drawer') {
    return (
      <Drawer
        finalFocus={triggerNode ? { current: triggerNode } : undefined}
        onOpenChange={onLayerChange}
        open={open}
        side="end"
        size="sm"
      >
        <DrawerBridge trigger={triggerNode} />
        <DrawerPanel aria-labelledby={titleId}>{panelNode}</DrawerPanel>
      </Drawer>
    );
  }

  return (
    <Popover
      align="start"
      initialFocus="[data-part='search'] input"
      onOpenChange={onLayerChange}
      open={open}
      side="bottom"
      size="lg"
    >
      <PopoverBridge trigger={triggerNode} />
      <PopoverLayer>
        <PopoverContent aria-labelledby={titleId}>{panelNode}</PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}

/* ── The trigger ───────────────────────────────────────────────────────── */

const NO_SNAPSHOT: TriggerSnapshot = {
  open: false,
  hidden: 0,
  rootId: '',
  t: () => '',
};
const NO_SUBSCRIPTION = () => () => undefined;

/**
 * The consumer's button, wired to a manager: the popup it opens, whether it
 * is open, what it controls, and the count of hidden columns after its words
 * — a chip on screen and a sentence in its accessible name.
 */
export function ColumnManagerTrigger({
  children,
  manager,
  onClick,
  ref,
  render,
  ...nativeProps
}: ColumnManagerTriggerProps) {
  const root = useContext(ColumnManagerRootContext);
  const [fromRef, setFromRef] = useState<TriggerChannel | null>(null);
  /* Passive, so it runs after the manager's handle is attached, wherever the
     trigger stands in the tree relative to it. */
  useEffect(() => {
    const handle = manager?.current;
    const next = handle ? (CHANNELS.get(handle) ?? null) : null;
    if (next !== fromRef) setFromRef(next);
  });
  const channel = fromRef ?? root?.channel ?? null;
  const snapshot = useSyncExternalStore(
    channel?.subscribe ?? NO_SUBSCRIPTION,
    channel?.get ?? (() => NO_SNAPSHOT),
    () => NO_SNAPSHOT,
  );

  const node = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    channel?.onTrigger(node.current);
    return () => channel?.onTrigger(null);
  }, [channel]);
  const setNode = useCallback(
    (element: HTMLButtonElement | null) => {
      node.current = element;
      attach(ref, element);
    },
    [ref],
  );

  const count = snapshot.hidden;
  const sentence = snapshot.t('hiddenCount', { count });

  const rootProps: ColumnManagerTriggerRootProps = keyedProps({
    ...nativeProps,
    'aria-controls': snapshot.open ? snapshot.rootId : undefined,
    'aria-expanded': snapshot.open,
    'aria-haspopup': 'dialog',
    'data-column-manager-trigger': '',
    'data-part': 'trigger',
    ...(snapshot.open ? { 'data-open': '' } : {}),
    children: (
      <>
        {children}
        {count > 0 ? (
          <>
            <span aria-hidden="true" data-part="count" data-part-count="">
              {count}
            </span>{' '}
            <VisuallyHidden>{sentence}</VisuallyHidden>
          </>
        ) : null}
      </>
    ),
    onClick: (event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      channel?.toggle(pressReason(event), event);
    },
    ref: setNode,
    type: nativeProps.type ?? 'button',
  });

  if (render) return render(rootProps);
  const { children: content, ref: buttonRef, ...buttonProps } = rootProps;
  return (
    <Button
      {...(buttonProps as object)}
      ref={buttonRef as Ref<HTMLButtonElement>}
      render={(props) => <button {...withSelectorKey(props, 'part', 'trigger')} />}
      tone="secondary"
      variant="outline"
    >
      {content}
    </Button>
  );
}
