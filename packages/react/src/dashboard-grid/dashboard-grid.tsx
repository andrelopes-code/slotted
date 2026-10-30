import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/dashboard-grid/dashboard-grid.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import {
  cellAt,
  DASHBOARD_SUBROWS,
  dashboardKeyIntent,
  gridStyle,
  layoutsEqual,
  materializeLayout,
  measureTiles,
  moveTile,
  moveTileBy,
  parseDuration,
  playFlip,
  playResize,
  resizeTileBy,
  resizeTileInClass,
  resolveColumns,
  resolveTiles,
  setTileHidden,
  observeContentSpan,
  sizeClassOf,
  spanFromTravel,
  swapTiles,
  tileStyle,
  type DashboardBox,
  type DashboardLayout,
  type DashboardLayoutChange,
  type DashboardSizeClass,
  type DashboardWidgetSpec,
  type MeasuredTile,
} from '@slotted/core/dashboard-grid';
import { createDragController, type DropTarget } from '@slotted/core/drag';
import { dashboardGridMessages, dragMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable, type ChangeReason, type ChangeRequest } from '@slotted/core/state';
import {
  Children,
  Fragment,
  isValidElement,
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
  type PointerEvent,
  type ReactNode,
} from 'react';

import { Button } from '../button';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuItem, MenuItemLabel, MenuTrigger } from '../menu';
import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import {
  DashboardGridContext,
  DashboardWidgetHostContext,
  DECLARED,
  type DashboardWidgetDeclaration,
  type DashboardEdge,
  type DashboardGridContextValue,
  type DashboardSlot,
} from './dashboard-grid-context';
import { useDashboardGridDefaults } from './dashboard-grid-defaults';
import type {
  DashboardEditingReason,
  DashboardEditingRequest,
  DashboardGridProps,
  DashboardGridRootProps,
  DashboardLayoutReason,
  DashboardWidgetProps,
} from './dashboard-grid.types';

const EMPTY_LAYOUT: DashboardLayout = [];
const GRID = 'dashboard-grid';
const PLACEHOLDER = '\u0000placeholder';

/* ── One value, two modes ──────────────────────────────────────────────── */

/**
 * The shared controllable, held across renders. It answers whether the
 * request went out uncancelled, which a controlled request does not say by its
 * return value: a change is announced when it is asked for, not when the
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

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent | { detail: number }): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function directionOf(element: Element | null): 'ltr' | 'rtl' {
  if (element === null || typeof getComputedStyle !== 'function') return 'ltr';
  return getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}

/** A grid not laid out yet — hidden, or in a test — is drawn in its stored class. */
function classOf(root: HTMLElement | null, expandedFrom?: number): DashboardSizeClass {
  return root !== null && root.clientWidth > 0
    ? sizeClassOf(root.clientWidth, expandedFrom)
    : 'expanded';
}

/** The widget's own declaration: the element the consumer wrote, or what it declared on mount. */
function specOf(
  props: DashboardWidgetDeclaration,
  contentSpans: ReadonlyMap<string, number>,
): DashboardWidgetSpec {
  const measured = props.rows === 'auto' ? contentSpans.get(props.value) : undefined;
  return {
    key: props.value,
    ...(measured === undefined ? {} : { contentSpan: measured }),
    ...(props.defaultColumns === undefined ? {} : { defaultColumns: props.defaultColumns }),
    ...(props.defaultRows === undefined ? {} : { defaultRows: props.defaultRows }),
    ...(props.minColumns === undefined ? {} : { minColumns: props.minColumns }),
    ...(props.maxColumns === undefined ? {} : { maxColumns: props.maxColumns }),
    ...(props.minRows === undefined ? {} : { minRows: props.minRows }),
    ...(props.maxRows === undefined ? {} : { maxRows: props.maxRows }),
    ...(props.movable === undefined ? {} : { movable: props.movable }),
    ...(props.resizable === undefined ? {} : { resizable: props.resizable }),
    ...(props.removable === undefined ? {} : { removable: props.removable }),
  };
}

/** The tracks the grid is drawn with in the class it is in, read from its style. */
interface Tracks {
  readonly columns: number;
  readonly track: number;
  readonly columnGap: number;
  readonly row: number;
  readonly rowGap: number;
}

function tracksOf(list: HTMLElement, columns: number): Tracks {
  const styles = getComputedStyle(list);
  const columnGap = parseFloat(styles.columnGap) || 0;
  const track = (list.clientWidth - columnGap * (columns - 1)) / Math.max(1, columns);
  /* The tracks are sub-rows with no gap between them; a row is twelve of them
     less the gap its widget draws below itself. */
  const pitch = (parseFloat(styles.gridAutoRows) || 0) * DASHBOARD_SUBROWS;
  const row = Math.max(0, pitch - columnGap);
  return { columns, track, columnGap, row, rowGap: columnGap };
}

/** Where a widget was picked up, relative to the grid, in logical terms. */
interface Origin {
  readonly inlineStart: number;
  readonly blockStart: number;
  readonly inlineSize: number;
  readonly blockSize: number;
}

function originOf(element: HTMLElement, list: HTMLElement, rtl: boolean): Origin {
  const box = element.getBoundingClientRect();
  const frame = list.getBoundingClientRect();
  return {
    inlineStart: rtl ? frame.right - box.right : box.left - frame.left,
    blockStart: box.top - frame.top,
    inlineSize: box.width,
    blockSize: box.height,
  };
}

/* The widget in hand is placed and moved by its own geometry, never by a
   custom property: one restyles everything under the widget, and it is
   written every frame. */
const LIFT = ['inset-inline-start', 'inset-block-start', 'inline-size', 'block-size', 'translate'];

function writeOrigin(element: HTMLElement, origin: Origin) {
  element.style.setProperty('inset-inline-start', `${origin.inlineStart}px`);
  element.style.setProperty('inset-block-start', `${origin.blockStart}px`);
  element.style.setProperty('inline-size', `${origin.inlineSize}px`);
  element.style.setProperty('block-size', `${origin.blockSize}px`);
}

function clearLift(element: HTMLElement | undefined) {
  if (element === undefined) return;
  for (const name of LIFT) element.style.removeProperty(name);
}

/** The children with every fragment opened, in the order they were written. */
function flatten(children: ReactNode, into: ReactNode[] = []): ReactNode[] {
  Children.forEach(children, (child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      flatten(child.props.children, into);
    } else {
      into.push(child);
    }
  });
  return into;
}

function sameDeclaration(
  a: DashboardWidgetDeclaration | undefined,
  b: DashboardWidgetDeclaration,
): boolean {
  return a !== undefined && DECLARED.every((name) => a[name] === b[name]);
}

function sameSlot(a: DashboardSlot, b: DashboardSlot): boolean {
  const tile = Object.keys(a.tile) as (keyof DashboardSlot['tile'])[];
  const can = Object.keys(a.can) as (keyof DashboardSlot['can'])[];
  return (
    a.order === b.order &&
    a.dragging === b.dragging &&
    a.resizing === b.resizing &&
    a.edge === b.edge &&
    a.readout === b.readout &&
    tile.every((name) => a.tile[name] === b.tile[name]) &&
    can.every((name) => a.can[name] === b.can[name])
  );
}

/** What a gesture has reached, as the grid draws it. */
type Gesture =
  | { readonly kind: 'move'; readonly key: string; readonly preview: DashboardLayout }
  | {
      readonly kind: 'resize';
      readonly key: string;
      readonly edge: DashboardEdge;
      readonly preview: DashboardLayout;
      readonly sizeClass: DashboardSizeClass;
    };

/**
 * A surface of widgets the reader places and sizes. The widgets are the
 * consumer's `DashboardWidget` children, each with its own `value`; the grid
 * draws them where the layout puts them, by row and then column, which is the
 * reading order, the focus order and the picture at every width.
 */
export function DashboardGrid({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  columns: columnsProp,
  defaultEditing = false,
  defaultLayout = EMPTY_LAYOUT,
  editBar: editBarProp,
  editing: editingProp,
  expandedFrom,
  headingLevel: headingLevelProp,
  layout: layoutProp,
  messages,
  onEditingChange,
  onLayoutChange,
  ref,
  render,
  style,
  ...nativeProps
}: DashboardGridProps) {
  const defaults = useDashboardGridDefaults();
  const t = useMessages(dashboardGridMessages, messages);
  const dragT = useMessages(dragMessages);
  const grid = useMemo(
    () => resolveColumns(columnsProp ?? defaults.columns),
    [columnsProp, defaults.columns],
  );
  const editBar = editBarProp ?? defaults.editBar;
  const headingLevel = headingLevelProp ?? defaults.headingLevel;
  const statusId = `${useId()}-edit-status`;

  /**
   * The widgets, in the order the consumer wrote them, by value. A child that
   * carries `value` is read where it stands, so it is laid out on the server
   * and in the first paint. Any other child — a component that renders a
   * widget — is drawn inside a host the widget declares itself through once
   * it mounts; until then it is drawn after the others and its widget draws
   * nothing. Fragments are read through.
   */
  const [declared, setDeclared] = useState<ReadonlyMap<number, DashboardWidgetDeclaration>>(
    () => new Map(),
  );
  const hostSetters = useRef(new Map<number, (declaration: DashboardWidgetDeclaration) => void>());
  const hostOf = useCallback((index: number) => {
    let setter = hostSetters.current.get(index);
    if (setter === undefined) {
      setter = (declaration) =>
        setDeclared((current) =>
          sameDeclaration(current.get(index), declaration)
            ? current
            : new Map(current).set(index, declaration),
        );
      hostSetters.current.set(index, setter);
    }
    return setter;
  }, []);
  const { declarations, elements, pending } = useMemo(() => {
    const byKey = new Map<string, DashboardWidgetDeclaration>();
    const nodes = new Map<string, ReactNode>();
    const waiting: ReactNode[] = [];
    let hosts = 0;
    for (const child of flatten(children)) {
      if (!isValidElement<Partial<DashboardWidgetProps>>(child)) continue;
      const { value } = child.props;
      if (typeof value === 'string') {
        if (byKey.has(value)) continue;
        byKey.set(value, child.props as DashboardWidgetDeclaration);
        nodes.set(value, child);
        continue;
      }
      const index = hosts++;
      const node = (
        <DashboardWidgetHostContext.Provider key={`host-${index}`} value={hostOf(index)}>
          {child}
        </DashboardWidgetHostContext.Provider>
      );
      const declaration = declared.get(index);
      if (declaration === undefined || byKey.has(declaration.value)) {
        waiting.push(node);
        continue;
      }
      byKey.set(declaration.value, declaration);
      nodes.set(declaration.value, node);
    }
    return { declarations: byKey, elements: nodes, pending: waiting };
  }, [children, declared, hostOf]);
  /* The rows each widget sized by its content measures, by value. */
  const [contentSpans, setContentSpans] = useState<ReadonlyMap<string, number>>(() => new Map());
  const widgets = useMemo(
    () => [...declarations.values()].map((declaration) => specOf(declaration, contentSpans)),
    [declarations, contentSpans],
  );
  const titles = useMemo(
    () => new Map([...declarations].map(([key, declaration]) => [key, declaration.title])),
    [declarations],
  );

  const [layout, requestLayout] = useModel<DashboardLayout, { change: DashboardLayoutChange }>(
    layoutProp,
    defaultLayout,
    onLayoutChange as never,
    layoutsEqual,
  );
  const [editing, requestEditing] = useModel<boolean>(
    editingProp,
    defaultEditing,
    onEditingChange as ((value: boolean, request: DashboardEditingRequest) => void) | undefined,
  );

  const tiles = useMemo(() => resolveTiles(layout, widgets, grid), [layout, widgets, grid]);
  const visible = useMemo(() => tiles.filter((tile) => !tile.hidden), [tiles]);

  const [gesture, setGestureState] = useState<Gesture | null>(null);
  const gestureRef = useRef<Gesture | null>(null);

  /* ── Elements ────────────────────────────────────────────────────────── */

  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const placeholderRef = useRef<HTMLLIElement | null>(null);
  const widgetNodes = useRef(new Map<string, HTMLLIElement>());
  const handleNodes = useRef(new Map<string, HTMLElement>());
  const cardNodes = useRef(new Map<string, HTMLElement>());
  const [nodesVersion, setNodesVersion] = useState(0);

  const registerIn = useCallback(
    <E extends HTMLElement>(map: Map<string, E>, key: string, element: E | null) => {
      const had = map.get(key);
      if (element === null) {
        if (had === undefined) return;
        map.delete(key);
      } else {
        if (had === element) return;
        map.set(key, element);
      }
      setNodesVersion((version) => version + 1);
    },
    [],
  );

  /* Stable, so a widget's ref callback never changes: a new callback would
     detach and reattach the element on every render, and a preview renders
     each time the target changes — each reattachment rebuilt the drag
     controller and ended the session under the pointer. */
  const registerWidget = useCallback(
    (key: string, element: HTMLLIElement | null) => registerIn(widgetNodes.current, key, element),
    [registerIn],
  );
  const registerHandle = useCallback(
    (key: string, element: HTMLElement | null) => registerIn(handleNodes.current, key, element),
    [registerIn],
  );
  const registerCard = useCallback(
    (key: string, element: HTMLElement | null) => registerIn(cardNodes.current, key, element),
    [registerIn],
  );

  const autoKeys = [...declarations.values()]
    .filter((declaration) => declaration.rows === 'auto')
    .map((declaration) => declaration.value)
    .join('\n');
  useEffect(() => {
    const list = listRef.current;
    if (list === null || autoKeys === '') return;
    const stops = autoKeys.split('\n').map((key) => {
      const card = cardNodes.current.get(key);
      if (card === undefined) return () => {};
      return observeContentSpan(card, list, (span) =>
        setContentSpans((current) => new Map(current).set(key, span)),
      );
    });
    return () => {
      for (const stop of stops) stop();
    };
  }, [autoKeys, nodesVersion]);

  /* The class the grid is drawn in, observed rather than read during render,
     so a server render and the first client render agree on `expanded`.
     Once measured it is written on the root, and the stylesheet follows it. */
  const [measuredClass, setMeasuredClass] = useState<DashboardSizeClass | null>(null);
  const drawnClass = measuredClass ?? 'expanded';
  useEffect(() => {
    if (!root || typeof ResizeObserver === 'undefined') return;
    const measure = () =>
      setMeasuredClass(root.clientWidth > 0 ? classOf(root, expandedFrom) : null);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, [root, expandedFrom]);

  /* ── Motion ──────────────────────────────────────────────────────────── */

  /** Measured before a change of what is drawn, played after it lands. */
  const flipFrom = useRef<Map<string, MeasuredTile> | null>(null);
  const settleFrom = useRef<{ key: string; box: MeasuredTile } | null>(null);
  const focusAfter = useRef<string | null>(null);

  const measureAll = useCallback(() => {
    const nodes = new Map<string, Element>(widgetNodes.current);
    const gestureKey = gestureRef.current?.key;
    if (gestureKey !== undefined) nodes.delete(gestureKey);
    if (placeholderRef.current) nodes.set(PLACEHOLDER, placeholderRef.current);
    flipFrom.current = measureTiles(nodes);
  }, []);

  const setGesture = useCallback(
    (next: Gesture | null) => {
      measureAll();
      gestureRef.current = next;
      setGestureState(next);
    },
    [measureAll],
  );

  /* ── Requests ────────────────────────────────────────────────────────── */

  const announce = useCallback(
    (message: string) => {
      const document = root?.ownerDocument;
      if (document && message !== '') getLiveAnnouncer(document).announce(message);
    },
    [root],
  );

  const live = useRef({ layout, widgets, grid, tiles, visible, t, dragT, titles, editing });
  live.current = { layout, widgets, grid, tiles, visible, t, dragT, titles, editing };

  const titleOf = useCallback((key: string) => live.current.titles.get(key) ?? key, []);

  const change = useCallback(
    (
      next: DashboardLayout,
      reason: DashboardLayoutReason,
      what: DashboardLayoutChange,
      source: Event | undefined,
      message: (layout: DashboardLayout) => string,
    ) => {
      const now = live.current;
      const full = materializeLayout(next, now.widgets, now.grid);
      if (layoutsEqual(full, materializeLayout(now.layout, now.widgets, now.grid))) return false;
      if (flipFrom.current === null) measureAll();
      const accepted = requestLayout(full, reason, source, { change: what });
      if (!accepted) {
        flipFrom.current = null;
        return false;
      }
      announce(message(full));
      return true;
    },
    [announce, measureAll, requestLayout],
  );

  const sizeClass = useCallback(
    (): DashboardSizeClass => classOf(root, expandedFrom),
    [root, expandedFrom],
  );

  const movedMessage = useCallback(
    (key: string, drawnIn: DashboardSizeClass) => (next: DashboardLayout) => {
      const now = live.current;
      const placed = resolveTiles(next, now.widgets, now.grid).filter((tile) => !tile.hidden);
      const index = placed.findIndex((tile) => tile.key === key);
      const tile = placed[index];
      if (tile === undefined) return '';
      return drawnIn === 'expanded'
        ? now.t('moved', {
            title: titleOf(key),
            row: tile.y + 1,
            column: tile.x + 1,
          })
        : now.t('movedInOrder', {
            title: titleOf(key),
            position: index + 1,
            total: placed.length,
          });
    },
    [titleOf],
  );

  const resizedMessage = useCallback(
    (key: string, drawnIn: DashboardSizeClass) => (next: DashboardLayout) => {
      const now = live.current;
      const tile = resolveTiles(next, now.widgets, now.grid).find((each) => each.key === key);
      return tile === undefined
        ? ''
        : now.t('resized', {
            title: titleOf(key),
            columns: drawnIn === 'medium' ? tile.medium : tile.w,
            rows: tile.h,
          });
    },
    [titleOf],
  );

  const move = useCallback<DashboardGridContextValue['move']>(
    (key, direction, reason, source) => {
      const now = live.current;
      const drawnIn = sizeClass();
      const next = moveTileBy(now.layout, now.widgets, now.grid, key, direction, drawnIn);
      focusAfter.current = key;
      if (!change(next, reason, { kind: 'move', key }, source, movedMessage(key, drawnIn))) {
        focusAfter.current = null;
      }
    },
    [change, movedMessage, sizeClass],
  );

  const resize = useCallback<DashboardGridContextValue['resize']>(
    (key, delta, reason, source) => {
      const now = live.current;
      const drawnIn = sizeClass();
      const next = resizeTileBy(now.layout, now.widgets, now.grid, key, delta, drawnIn);
      focusAfter.current = key;
      if (!change(next, reason, { kind: 'resize', key }, source, resizedMessage(key, drawnIn))) {
        focusAfter.current = null;
      }
    },
    [change, resizedMessage, sizeClass],
  );

  const hide = useCallback<DashboardGridContextValue['hide']>(
    (key, reason, source) => {
      const now = live.current;
      const at = now.visible.findIndex((tile) => tile.key === key);
      const tile = now.visible[at];
      if (tile === undefined || !tile.removable) return;
      const neighbour = now.visible[at + 1] ?? now.visible[at - 1];
      focusAfter.current = neighbour?.key ?? `${GRID}:add`;
      const next = setTileHidden(now.layout, now.widgets, now.grid, key, true);
      const done = change(next, reason, { kind: 'hide', key }, source, () =>
        now.t('hidden', { title: titleOf(key) }),
      );
      if (!done) focusAfter.current = null;
    },
    [change, titleOf],
  );

  const show = useCallback(
    (key: string, reason: DashboardLayoutReason, source?: Event) => {
      const now = live.current;
      focusAfter.current = key;
      const next = setTileHidden(now.layout, now.widgets, now.grid, key, false);
      change(next, reason, { kind: 'show', key }, source, () =>
        now.t('shown', { title: titleOf(key) }),
      );
    },
    [change, titleOf],
  );

  /* ── Editing ─────────────────────────────────────────────────────────── */

  /** The layout editing began from, and the element that held focus then. */
  const snapshot = useRef<DashboardLayout | null>(null);
  const returnFocus = useRef<Element | null>(null);
  /* False on the first pass, so a grid that mounts in editing keeps a layout
     to cancel back to. */
  const wasEditing = useRef(false);
  useLayoutEffect(() => {
    if (editing && !wasEditing.current) {
      const now = live.current;
      snapshot.current = materializeLayout(now.layout, now.widgets, now.grid);
      returnFocus.current = root?.ownerDocument.activeElement ?? null;
    }
    if (!editing && wasEditing.current) {
      const document = root?.ownerDocument;
      const active = document?.activeElement ?? null;
      const lost = active === null || active === document?.body || !active.isConnected;
      const back = returnFocus.current;
      if (lost && back instanceof HTMLElement && back.isConnected) back.focus();
      snapshot.current = null;
      returnFocus.current = null;
    }
    wasEditing.current = editing;
  }, [editing, root]);

  const commitEditing = useCallback(
    (reason: DashboardEditingReason, source?: Event) => {
      requestEditing(false, reason, source);
    },
    [requestEditing],
  );

  const cancelEditing = useCallback(
    (reason: DashboardEditingReason, source?: Event) => {
      const now = live.current;
      const back = snapshot.current;
      if (back !== null) {
        change(back, 'dismiss', { kind: 'cancel', key: null }, source, () => now.t('cancelled'));
      }
      requestEditing(false, reason, source);
    },
    [change, requestEditing],
  );

  const reset = useCallback(
    (reason: DashboardLayoutReason, source?: Event) => {
      const now = live.current;
      change(defaultLayout, reason, { kind: 'reset', key: null }, source, () => now.t('resetDone'));
    },
    [change, defaultLayout],
  );

  /* ── Keyboard ────────────────────────────────────────────────────────── */

  const onHandleKeyDown = useCallback(
    (key: string, event: KeyboardEvent<HTMLElement>) => {
      const intent = dashboardKeyIntent(event, directionOf(event.currentTarget));
      if (intent === null) return;
      const tile = live.current.visible.find((each) => each.key === key);
      if (tile === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      const source = event.nativeEvent;
      if (intent.kind === 'move' && tile.movable) move(key, intent.direction, 'keyboard', source);
      if (intent.kind === 'resize' && tile.resizable) {
        resize(key, { columns: intent.columns, rows: intent.rows }, 'keyboard', source);
      }
      if (intent.kind === 'hide') hide(key, 'remove', source);
    },
    [hide, move, resize],
  );

  /* ── Pointer: resize ─────────────────────────────────────────────────── */

  const resizing = useRef<(() => void) | null>(null);

  const onResizePointerDown = useCallback(
    (key: string, edge: DashboardEdge, event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || resizing.current !== null) return;
      const now = live.current;
      const tile = now.visible.find((each) => each.key === key);
      const list = listRef.current;
      const element = widgetNodes.current.get(key);
      if (tile === undefined || !tile.resizable || list === null || element === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      const drawnIn = sizeClass();
      if (drawnIn === 'compact') return;
      const handle = event.currentTarget;
      const rtl = directionOf(list) === 'rtl';
      const tracks = tracksOf(list, now.grid[drawnIn]);
      const origin = originOf(element, list, rtl);
      const start = { x: event.clientX, y: event.clientY };
      const span = drawnIn === 'medium' ? tile.medium : tile.w;
      const pullsStart = edge === 'start' || edge === 'bottom-start';
      const pullsEnd = edge === 'end' || edge === 'bottom-end';
      const pullsBottom = edge !== 'start' && edge !== 'end';
      let snapped: DashboardBox = { x: tile.x, y: tile.y, w: span, h: tile.h };
      let preview: DashboardLayout = materializeLayout(now.layout, now.widgets, now.grid);

      writeOrigin(element, origin);
      setGesture({ kind: 'resize', key, edge, preview, sizeClass: drawnIn });

      const onMove = (moved: globalThis.PointerEvent) => {
        const dx = moved.clientX - start.x;
        const dy = moved.clientY - start.y;
        /* Travel toward the inline end, whichever way the document reads. */
        const along = rtl ? -dx : dx;
        const floor = tracks.track;
        const inlineSize = pullsEnd
          ? Math.max(floor, origin.inlineSize + along)
          : pullsStart
            ? Math.max(floor, origin.inlineSize - along)
            : origin.inlineSize;
        const blockSize = pullsBottom
          ? Math.max(tracks.row, origin.blockSize + dy)
          : origin.blockSize;
        element.style.setProperty('inline-size', `${inlineSize}px`);
        element.style.setProperty('block-size', `${blockSize}px`);
        /* Pulled by its start, the widget keeps its end still: the element is
           anchored at its start, so it moves by what it grew. */
        const shift = pullsStart ? origin.inlineSize - inlineSize : 0;
        element.style.setProperty('translate', `${rtl ? -shift : shift}px 0px`);

        const w = spanFromTravel({
          span,
          track: tracks.track,
          gap: tracks.columnGap,
          travel: inlineSize - origin.inlineSize,
        });
        const h = pullsBottom
          ? spanFromTravel({
              span: tile.h,
              track: tracks.row,
              gap: tracks.rowGap,
              travel: blockSize - origin.blockSize,
            })
          : tile.h;
        const x = pullsStart ? tile.x + tile.w - w : tile.x;
        if (w === snapped.w && h === snapped.h && x === snapped.x) return;
        snapped = { x, y: tile.y, w, h };
        const state = live.current;
        preview = resizeTileInClass(state.layout, state.widgets, state.grid, key, snapped, drawnIn);
        setGesture({ kind: 'resize', key, edge, preview, sizeClass: drawnIn });
      };

      const finish = (commit: boolean, source?: Event) => {
        resizing.current?.();
        const box = element.getBoundingClientRect();
        settleFrom.current = {
          key,
          box: { left: box.left, top: box.top, width: box.width, height: box.height },
        };
        clearLift(element);
        setGesture(null);
        if (!commit) return;
        change(preview, 'pointer', { kind: 'resize', key }, source, resizedMessage(key, drawnIn));
      };
      const onUp = (up: globalThis.PointerEvent) => finish(true, up);
      const onCancel = () => finish(false);
      const onKey = (down: globalThis.KeyboardEvent) => {
        if (down.key !== 'Escape') return;
        down.preventDefault();
        down.stopPropagation();
        finish(false);
      };
      const document = handle.ownerDocument;
      handle.setPointerCapture?.(event.pointerId);
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onCancel);
      document.addEventListener('keydown', onKey, true);
      resizing.current = () => {
        resizing.current = null;
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onCancel);
        document.removeEventListener('keydown', onKey, true);
        if (handle.hasPointerCapture?.(event.pointerId)) {
          handle.releasePointerCapture(event.pointerId);
        }
      };
    },
    [change, resizedMessage, setGesture, sizeClass],
  );

  useEffect(() => () => resizing.current?.(), []);

  /* ── Pointer: move ───────────────────────────────────────────────────── */

  useEffect(() => {
    const list = listRef.current;
    if (!root || !editing || list === null) return;
    const document = root.ownerDocument;
    const keys = () => live.current.visible.map((tile) => tile.key);

    /** Where the press landed, and where in the widget. */
    let press: { x: number; y: number; grabX: number; grabY: number; key: string } | null = null;
    let target: string | null = null;
    let drawnIn: DashboardSizeClass = 'expanded';
    let rtl = false;
    let tracks: Tracks | null = null;

    const onPress = (event: globalThis.PointerEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLLIElement>(
        '[data-part="widget"]',
      );
      const key = element?.dataset['key'];
      if (!element || key === undefined || element.parentElement !== list) return;
      const box = element.getBoundingClientRect();
      press = {
        x: event.clientX,
        y: event.clientY,
        grabX: event.clientX - box.left,
        grabY: event.clientY - box.top,
        key,
      };
    };
    list.addEventListener('pointerdown', onPress, true);

    /** The preview a target stands for. */
    const previewOf = (key: string, at: string): DashboardLayout => {
      const now = live.current;
      if (at.startsWith('swap:')) {
        return swapTiles(now.layout, now.widgets, now.grid, key, at.slice(5));
      }
      const [x, y] = at.split(',').map(Number);
      return moveTile(now.layout, now.widgets, now.grid, key, { x: x ?? 0, y: y ?? 0 });
    };

    const controller = createDragController({
      document,
      restoreFocus: false,
      preview: false,
      autoScroll: { axis: 'y' },
      t: (key, slots) => live.current.dragT(key, slots),
      /* The move says what happened once, in the family's own words. */
      silent: ['pickedUp', 'moved', 'dropped', 'cancelled'],
      /**
       * In the expanded class the target is a cell: the one the card's leading
       * corner is nearest, so a widget lands where it is drawn under the
       * pointer. In the classes that flow the target is the widget under the
       * pointer, which the carried one exchanges places with.
       */
      resolveTarget: (point) => {
        const session = controller.state;
        const carried = session.items[0];
        if (carried === undefined || press === null || tracks === null) return null;
        const frame = list.getBoundingClientRect();
        if (drawnIn === 'expanded') {
          const left = point.x - press.grabX;
          const top = point.y - press.grabY;
          const tile = live.current.visible.find((each) => each.key === carried);
          const width = tile ? tile.w * tracks.track + (tile.w - 1) * tracks.columnGap : 0;
          const lead = rtl ? left + width - tracks.track / 2 : left + tracks.track / 2;
          const cell = cellAt(
            { x: lead, y: top + tracks.row / 2 },
            { left: frame.left, top: frame.top, width: frame.width },
            { columns: tracks.columns, row: tracks.row, gap: tracks.columnGap },
            rtl ? 'rtl' : 'ltr',
          );
          target = `${cell.x},${cell.y}`;
        } else {
          for (const [key, element] of widgetNodes.current) {
            if (key === carried) continue;
            const rect = element.getBoundingClientRect();
            if (
              point.x >= rect.left &&
              point.x <= rect.right &&
              point.y >= rect.top &&
              point.y <= rect.bottom
            ) {
              target = `swap:${key}`;
              break;
            }
          }
        }
        return target === null
          ? null
          : ({ kind: 'on', container: GRID, key: target } satisfies DropTarget);
      },
      onTargetChange: ({ state }) => {
        const key = state.items[0];
        if (key === undefined || state.target?.kind !== 'on') return;
        setGesture({ kind: 'move', key, preview: previewOf(key, state.target.key) });
      },
      onDrop: ({ items, target: dropped, reason, event }) => {
        const key = items[0];
        if (key === undefined || dropped.kind !== 'on') return;
        focusAfter.current = null;
        change(
          previewOf(key, dropped.key),
          reason === 'keyboard' ? 'keyboard' : 'pointer',
          { kind: 'move', key },
          event,
          movedMessage(key, drawnIn),
        );
      },
    });

    const unregister = controller.registerContainer({
      key: GRID,
      items: keys,
      orientation: 'grid',
      targets: ['on'],
      element: () => list,
      itemElement: (key) => widgetNodes.current.get(key) ?? null,
      label: () => live.current.t('editBar'),
      itemLabel: titleOf,
    });

    /* The click the browser fires after a pointer drag belongs to the drag,
       not to the handle it started on, which would open the handle's menu. */
    let swallow = false;
    let dragging: string | null = null;
    const onClick = (event: Event) => {
      if (!swallow) return;
      swallow = false;
      event.preventDefault();
      event.stopPropagation();
    };
    root.addEventListener('click', onClick, true);

    const unsubscribe = controller.subscribe((state) => {
      if (state.status !== 'dragging') {
        if (dragging !== null) {
          const element = widgetNodes.current.get(dragging);
          if (element) {
            const box = element.getBoundingClientRect();
            settleFrom.current = {
              key: dragging,
              box: { left: box.left, top: box.top, width: box.width, height: box.height },
            };
          }
          clearLift(element);
          swallow = state.reason === 'pointer' || state.reason === null;
          window.setTimeout(() => {
            swallow = false;
          }, 0);
          dragging = null;
          target = null;
          if (gestureRef.current?.kind === 'move') setGesture(null);
        }
        return;
      }
      const key = state.items[0];
      if (key === undefined || press === null) return;
      const element = widgetNodes.current.get(key);
      if (element === undefined) return;
      if (dragging === null) {
        dragging = key;
        drawnIn = classOf(root);
        rtl = directionOf(list) === 'rtl';
        tracks = tracksOf(list, live.current.grid[drawnIn]);
        writeOrigin(element, originOf(element, list, rtl));
        setGesture({
          kind: 'move',
          key,
          preview: materializeLayout(live.current.layout, live.current.widgets, live.current.grid),
        });
      }
      if (state.point !== null) {
        element.style.setProperty(
          'translate',
          `${state.point.x - press.x}px ${state.point.y - press.y}px`,
        );
      }
    });

    /* Two ways to pick a widget up: its card, by a mouse or a pen — a finger
       on the card scrolls the page — and its handle, by anything. */
    const detachments: (() => void)[] = [];
    for (const tile of live.current.visible) {
      if (!tile.movable) continue;
      const element = widgetNodes.current.get(tile.key);
      if (element === undefined) continue;
      const card = cardNodes.current.get(tile.key);
      const handle = handleNodes.current.get(tile.key);
      if (card) {
        detachments.push(
          controller.attachDraggable(element, {
            container: GRID,
            key: tile.key,
            handle: () => card,
            canDrag: (event) => event.pointerType !== 'touch',
          }),
        );
      }
      if (handle) {
        detachments.push(
          controller.attachDraggable(element, {
            container: GRID,
            key: tile.key,
            handle: () => handle,
            delay: { touch: 0 },
          }),
        );
      }
    }

    return () => {
      for (const detach of detachments) detach();
      list.removeEventListener('pointerdown', onPress, true);
      root.removeEventListener('click', onClick, true);
      unsubscribe();
      unregister();
      controller.destroy();
    };
  }, [root, editing, nodesVersion, change, movedMessage, setGesture, titleOf]);

  /* ── After a change lands ────────────────────────────────────────────── */

  const layoutKey = useMemo(
    () => JSON.stringify(materializeLayout(layout, widgets, grid)),
    [layout, widgets, grid],
  );

  useLayoutEffect(() => {
    if (root === null) return;
    const styles = getComputedStyle(root);
    const timing = {
      duration: parseDuration(styles.getPropertyValue('--slotted-duration-medium')),
      easing: styles.getPropertyValue('--slotted-easing-standard').trim() || 'ease',
    };
    const before = flipFrom.current;
    if (before !== null) {
      flipFrom.current = null;
      const nodes = new Map<string, HTMLElement>(widgetNodes.current);
      const gestureKey = gestureRef.current?.key;
      if (gestureKey !== undefined) nodes.delete(gestureKey);
      if (placeholderRef.current) nodes.set(PLACEHOLDER, placeholderRef.current);
      playFlip(nodes, before, timing);
    }
    const settling = settleFrom.current;
    if (settling !== null && gestureRef.current === null) {
      settleFrom.current = null;
      const element = widgetNodes.current.get(settling.key);
      if (element) playResize(element, settling.box, timing);
    }
    const key = focusAfter.current;
    if (key === null) return;
    focusAfter.current = null;
    const target =
      key === `${GRID}:add`
        ? root.querySelector<HTMLElement>('[data-part="add"]')
        : live.current.editing
          ? handleNodes.current.get(key)
          : null;
    if (target && target !== root.ownerDocument.activeElement) target.focus();
  }, [layoutKey, gesture, root]);

  /* ── Handle ──────────────────────────────────────────────────────────── */

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return root;
      },
      focusWidget: (key: string) => {
        const target =
          (live.current.editing ? handleNodes.current.get(key) : undefined) ??
          widgetNodes.current
            .get(key)
            ?.querySelector<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
        target?.focus();
      },
      commitEditing: () => commitEditing('programmatic'),
      cancelEditing: () => cancelEditing('programmatic'),
    }),
    [cancelEditing, commitEditing, root],
  );

  /* ── Rendering ───────────────────────────────────────────────────────── */

  /* What is drawn: the committed layout, or the one a gesture previews. */
  const drawn = useMemo(
    () => (gesture === null ? tiles : resolveTiles(gesture.preview, widgets, grid)),
    [gesture, tiles, widgets, grid],
  );
  const drawnVisible = useMemo(() => drawn.filter((tile) => !tile.hidden), [drawn]);

  /* What each widget's menu can do, from the committed layout: eight trial
     layouts a widget, which no preview changes. */
  const abilities = useMemo(() => {
    const map = new Map<string, DashboardSlot['can']>();
    const committed = materializeLayout(layout, widgets, grid);
    const differs = (next: DashboardLayout) =>
      !layoutsEqual(materializeLayout(next, widgets, grid), committed);
    for (const tile of visible) {
      const at = (direction: 'up' | 'down' | 'left' | 'right') =>
        editing && differs(moveTileBy(layout, widgets, grid, tile.key, direction, drawnClass));
      const by = (columns: number, rows: number) =>
        editing &&
        differs(resizeTileBy(layout, widgets, grid, tile.key, { columns, rows }, drawnClass));
      map.set(tile.key, {
        up: at('up'),
        down: at('down'),
        left: at('left'),
        right: at('right'),
        wider: by(1, 0),
        narrower: by(-1, 0),
        taller: by(0, 1),
        shorter: by(0, -1),
      });
    }
    return map;
  }, [visible, editing, layout, widgets, grid, drawnClass]);

  /* A slot that says what it said before is the same object, so a widget the
     preview leaves where it was is not drawn again. */
  const drawnSlots = useRef(new Map<string, DashboardSlot>());
  const slots = useMemo(() => {
    const map = new Map<string, DashboardSlot>();
    const order = new Map(drawnVisible.map((tile, index) => [tile.key, index]));
    for (const tile of visible) {
      const shown = drawn.find((each) => each.key === tile.key) ?? tile;
      const inHand = gesture !== null && gesture.key === tile.key;
      const resizingThis = inHand && gesture.kind === 'resize';
      const next: DashboardSlot = {
        tile: shown,
        /* Only a flow reads an order; cells placed explicitly would be drawn
           again for an order nothing reads. */
        order: gesture === null || drawnClass === 'expanded' ? undefined : order.get(tile.key),
        dragging: inHand && gesture.kind === 'move',
        resizing: resizingThis,
        edge: resizingThis ? gesture.edge : null,
        readout: resizingThis
          ? t('size', {
              columns: gesture.sizeClass === 'medium' ? shown.medium : shown.w,
              rows: shown.h,
            })
          : null,
        can: abilities.get(tile.key)!,
      };
      const before = drawnSlots.current.get(tile.key);
      map.set(tile.key, before !== undefined && sameSlot(before, next) ? before : next);
    }
    return map;
  }, [drawn, drawnVisible, visible, gesture, t, abilities, drawnClass]);
  useLayoutEffect(() => {
    drawnSlots.current = slots;
  }, [slots]);

  const context = useMemo<DashboardGridContextValue>(
    () => ({
      editing,
      t,
      headingLevel,
      statusId,
      sizeClass: drawnClass,
      slots,
      registerWidget,
      registerHandle,
      registerCard,
      move,
      resize,
      hide,
      onHandleKeyDown,
      onResizePointerDown,
    }),
    [
      editing,
      t,
      headingLevel,
      statusId,
      drawnClass,
      slots,
      registerWidget,
      registerHandle,
      registerCard,
      move,
      resize,
      hide,
      onHandleKeyDown,
      onResizePointerDown,
    ],
  );

  const hidden = tiles.filter((tile) => tile.hidden);
  const status = (
    <p
      data-part="edit-status"
      data-part-edit-status=""
      id={statusId}
      {...(editBar
        ? {}
        : { 'data-ui': 'visually-hidden', ...selectorKeyProps('ui', 'visually-hidden') })}
    >
      {t('editStatus')}
    </p>
  );

  const addMenu =
    hidden.length === 0 ? null : (
      <Menu>
        <MenuTrigger
          render={({ ref: triggerRef, ...props }) => (
            <Button
              {...(props as object)}
              size="sm"
              variant="outline"
              tone="secondary"
              start={
                <Icon>
                  <Glyph name="plus" />
                </Icon>
              }
              render={(buttonProps) => (
                <button
                  {...withSelectorKey(buttonProps, 'part', 'add')}
                  ref={triggerRef as never}
                />
              )}
            >
              {t('add')}
            </Button>
          )}
        />
        <MenuContent>
          {hidden.map((tile) => (
            <MenuItem
              key={tile.key}
              onSelect={(event) =>
                show(tile.key, event.reason === 'keyboard' ? 'keyboard' : 'pointer', event.source)
              }
            >
              <MenuItemLabel>{titleOf(tile.key)}</MenuItemLabel>
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    );

  const barButton = (
    part: 'reset' | 'cancel' | 'done',
    label: string,
    onPress: (event: MouseEvent<HTMLButtonElement>) => void,
  ) => (
    <Button
      size="sm"
      tone={part === 'done' ? 'accent' : 'secondary'}
      variant={part === 'done' ? 'solid' : part === 'cancel' ? 'outline' : 'ghost'}
      onClick={onPress}
      render={(buttonProps) => <button {...withSelectorKey(buttonProps, 'part', part)} />}
    >
      {label}
    </Button>
  );

  const placeholderTile = gesture === null ? null : drawn.find((tile) => tile.key === gesture.key);

  const rootProps: DashboardGridRootProps = keyedProps({
    ...nativeProps,
    style: { ...(gridStyle(grid) as CSSProperties), ...style },
    'data-ui': 'dashboard-grid',
    'data-part': 'root',
    ...(editing ? { 'data-editing': '' } : {}),
    ...(measuredClass === null ? {} : { 'data-size-class': measuredClass }),
    ref: setRoot,
    children: (
      <>
        {editing && editBar ? (
          <div data-part="edit-bar" data-part-edit-bar="" role="group" aria-label={t('editBar')}>
            {status}
            <div data-part="edit-actions" data-part-edit-actions="">
              {addMenu}
              {barButton('reset', t('reset'), (event) =>
                reset(pressReason(event), event.nativeEvent),
              )}
              {barButton('cancel', t('cancel'), (event) =>
                cancelEditing(pressReason(event), event.nativeEvent),
              )}
              {barButton('done', t('done'), (event) => commitEditing('submit', event.nativeEvent))}
            </div>
          </div>
        ) : null}
        {editing && !editBar ? status : null}
        <ul
          ref={listRef}
          data-part="grid"
          data-part-grid=""
          {...(gesture === null ? {} : { 'data-gesture': '' })}
          role="list"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          hidden={visible.length === 0 || undefined}
        >
          {/* Keyed by value: a dashboard written as static JSX carries no key,
              and drawn by position a widget that changed places remounted the
              content of the one before it. */}
          <DashboardWidgetHostContext.Provider value={null}>
            {visible.map((tile) => (
              <Fragment key={tile.key}>{elements.get(tile.key)}</Fragment>
            ))}
            {pending}
          </DashboardWidgetHostContext.Provider>
          {placeholderTile ? (
            <li
              ref={placeholderRef}
              data-part="placeholder"
              data-part-placeholder=""
              aria-hidden="true"
              style={
                {
                  ...tileStyle(placeholderTile),
                  ...(drawnClass === 'expanded'
                    ? {}
                    : {
                        order: drawnVisible.findIndex((tile) => tile.key === placeholderTile.key),
                      }),
                } as CSSProperties
              }
            />
          ) : null}
        </ul>
        {visible.length === 0 ? (
          <div data-part="empty" data-part-empty="">
            <ResultState status="empty" reach="section" live="polite">
              <ResultStateContent>
                <ResultStateTitle>{t('empty')}</ResultStateTitle>
                {editing ? (
                  <ResultStateDescription>{t('emptyEditing')}</ResultStateDescription>
                ) : null}
              </ResultStateContent>
            </ResultState>
          </div>
        ) : null}
      </>
    ),
  });

  return (
    <DashboardGridContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </DashboardGridContext.Provider>
  );
}
