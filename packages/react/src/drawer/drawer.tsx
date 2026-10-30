import '@slotted/styles/drawer/drawer.css';

import { extentBounds } from '@slotted/core/extent';
import { drawerMessages } from '@slotted/core/i18n';
import { clamp } from '@slotted/core/measure';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useMessages } from '../i18n';
import { useDrawerDefaults } from './drawer-defaults';
import type {
  DrawerContextValue,
  DrawerExtentReason,
  DrawerHandle,
  DrawerOpenReason,
  DrawerProps,
} from './drawer.types';

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

/**
 * What the drawer around this part says. A part outside one has no drawer to
 * belong to and no state to report, so this throws rather than rendering
 * something that looks right and closes nothing.
 */
export function useDrawer(): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('Every drawer part must be rendered inside Drawer.');
  }
  return context;
}

const NO_SNAP_POINTS: readonly number[] = [];

/**
 * A panel that comes in from an edge, and either covers the page or stands
 * beside it.
 *
 * The layer is composed from `packages/core` and rewritten nowhere: `portal`
 * decides where it lives and keeps the theme of the region that opened it,
 * `dismissable-layer` owns Escape, outside press, `inert`, the scroll lock and
 * the single z-index stack, `presence` keeps it mounted long enough to leave,
 * `focus` contains the keyboard and gives it back to the trigger, and `extent`
 * holds the arithmetic the separator's pointer and keyboard share.
 *
 * Under `mode="inline"` the first two are not composed at all: an inline drawer
 * is a box in the consumer's own layout, nothing is inert, nothing is contained
 * and there is no scrim. `focus` still restores, because a reader standing
 * inside a panel that is closing would otherwise be left inside an `inert`
 * subtree.
 *
 * This component renders no DOM. It is the provider, and the trigger has to be
 * a descendant of it while the layer is portalled out — the shape Radix, Base
 * UI and Ark all reach. Angular needs no equivalent, and
 * `docs/history/designs/2026-09-04-drawer-design.md` §11 says why.
 */
export function Drawer({
  children,
  back,
  container,
  defaultExtent,
  defaultOpen,
  drag,
  escape,
  extent,
  finalFocus,
  initialFocus,
  loading,
  maxExtent,
  messages,
  minExtent,
  modal,
  mode,
  mount,
  onExtentChange,
  onOpenChange,
  onOpenChangeComplete,
  open,
  outsidePress,
  ref,
  scrimFrom,
  side,
  size,
  snapPoints,
}: DrawerProps) {
  const defaults = useDrawerDefaults();
  const t = useMessages(drawerMessages, messages);
  const baseId = useId();

  const [ownOpen, setOwnOpen] = useState<boolean>(defaultOpen ?? false);
  const currentOpen = open ?? ownOpen;

  const [ownExtent, setOwnExtent] = useState<number | undefined>(defaultExtent);
  const currentExtent = extent ?? ownExtent;

  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState<number | null>(null);
  const [rest, setRest] = useState<number | undefined>(undefined);

  const resolvedMode = mode ?? defaults.mode;
  /**
   * `inline` fixes modality at `false` rather than leaving it to a prop. The
   * APG warns that a container marked modal while the page around it stays
   * reachable has severe consequences for the readers who rely on the mark,
   * and an inline drawer is reachable by definition.
   */
  const resolvedModal = resolvedMode === 'inline' ? false : (modal ?? defaults.modal);
  const resolvedMount = mount ?? defaults.mount;
  const resolvedSide = side ?? defaults.side;
  /**
   * A sheet measures what it holds and a side panel takes a named step: every
   * native sheet sizes to its content, and Ant, Fluent and MUI all give a side
   * panel a width. The side decides only when nothing else has.
   */
  const resolvedSize =
    size ??
    defaults.size ??
    (resolvedSide === 'top' || resolvedSide === 'bottom' ? 'content' : 'md');
  const resolvedEscape = resolvedMode === 'inline' ? 'none' : (escape ?? defaults.escape);
  const resolvedBack = resolvedMode === 'inline' ? 'none' : (back ?? defaults.back);
  const resolvedOutsidePress =
    resolvedMode === 'inline' ? 'none' : (outsidePress ?? defaults.outsidePress);
  const resolvedSnapPoints = snapPoints ?? NO_SNAP_POINTS;

  /**
   * The limits are the first and last stop when there are stops, because a
   * range whose ends no stop can reach has two values nothing produces.
   */
  const bounds = useMemo(() => {
    const stops = extentBounds(resolvedSnapPoints, minExtent ?? 0.2, maxExtent ?? 1);
    /* Under `content` the height of the content is a stop above the snap
       points, so the range reaches past the last of them. */
    return resolvedSize === 'content'
      ? { ...stops, max: Math.max(stops.max, maxExtent ?? 1) }
      : stops;
  }, [maxExtent, minExtent, resolvedSize, resolvedSnapPoints]);

  /**
   * The status rather than a boolean. `entering` is one frame long and it is
   * the whole reason it exists: a panel that appears already open gives its CSS
   * transition no closed style to start from.
   */
  const [status, setStatus] = useState<PresenceStatus>(currentOpen ? 'entering' : 'unmounted');
  const presence = useRef<PresenceHandle | null>(null);
  const settled = useRef(onOpenChangeComplete);
  settled.current = onOpenChangeComplete;
  if (presence.current === null) {
    /* A layer mounted open enters as one opened later does: an application
       that renders it conditionally, `{subject && <Drawer open />}`, saw it
       appear in its final state with no entrance. */
    presence.current = createPresence({
      onEnterComplete: () => settled.current?.(true),
      onExitComplete: () => settled.current?.(false),
      onStatusChange: setStatus,
      present: currentOpen,
      skipInitialAnimation: false,
    });
  }

  useEffect(() => {
    presence.current?.sync(currentOpen);
  }, [currentOpen]);

  /* A sheet closed by a drag keeps the hand's position through its exit, so it
     slides from there; opening again starts from rest. */
  useEffect(() => {
    if (currentOpen) setLive(null);
  }, [currentOpen]);

  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => {
    const handle = presence.current;
    return () => handle?.stop();
  }, []);

  /** Whether this drawer has ever been open, which is what `lazy` reads. */
  const seen = useRef(currentOpen);
  if (currentOpen) seen.current = true;

  /**
   * An inline drawer is always in the document: its own measure is what opens
   * and closes, and a box that left the layout would take the page's columns
   * with it every time the reader closed the panel.
   */
  const mounted =
    resolvedMode === 'inline' || resolvedMount === 'eager'
      ? true
      : resolvedMount === 'lazy'
        ? seen.current
        : status !== 'unmounted';

  const nodes = useRef({
    layer: null as HTMLElement | null,
    panel: null as HTMLElement | null,
    trigger: null as HTMLElement | null,
  });

  const [titleRendered, setTitleRendered] = useState(false);
  const [descriptionRendered, setDescriptionRendered] = useState(false);

  /**
   * A part says it exists, so the panel wires only what was rendered. The ids
   * are generated before the parts are known, and an `aria-labelledby` pointing
   * at an id nothing carries is worse than no accessible name at all.
   */
  const announce = useCallback<DrawerContextValue['announce']>((part) => {
    if (part === 'title') setTitleRendered(true);
    else setDescriptionRendered(true);

    return () => {
      if (part === 'title') setTitleRendered(false);
      else setDescriptionRendered(false);
    };
  }, []);

  /**
   * Stable for the life of the component, and that is the whole point.
   * `@slotted/core/presence` treats `setNode(null)` during an exit as the exit
   * ending — a node that has gone has nothing left to animate — and React calls
   * an *inline* ref callback with `null` and then with the node on every single
   * render. The render that starts the exit therefore ended it in the same
   * frame, and the panel disappeared instead of leaving. Only a browser shows
   * it: jsdom reports no transition duration, so the exit is instant there
   * whatever this does.
   */
  const registerLayer = useCallback((node: HTMLElement | null) => {
    nodes.current.layer = node;
    presence.current?.setNode(node);
  }, []);

  const requestOpen = useCallback(
    (next: boolean, reason: DrawerOpenReason, result: string | undefined, source: unknown) => {
      if (next === currentOpen) return;

      let cancelled = false;
      const state = createControllable<boolean>({
        controlled: open,
        initial: currentOpen,
        onRequest: (raw) => {
          cancelled = raw.cancelled;
          onOpenChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            previous: raw.previous,
            reason,
            result,
            source: raw.source,
            value: raw.value,
          });
        },
      });

      const moved = state.request(next, reason, source);
      if (cancelled) return;
      if (moved) setOwnOpen(next);
    },
    [currentOpen, onOpenChange, open],
  );

  /**
   * The measure the reader is moving. While the pointer is down the floor is
   * not enforced — a sheet the reader is pulling down has to follow the hand —
   * and `DrawerResizer` decides on release whether that means a smaller panel
   * or a closed one.
   */
  const requestExtent = useCallback(
    (next: number | undefined, reason: DrawerExtentReason, source: unknown) => {
      /* `undefined` travels whole: it is the panel back on its size step, and
         a clamp of it would be a clamp of a value that is not a fraction. */
      const wanted = next === undefined ? undefined : clamp(next, 0, bounds.max);
      if (wanted === currentExtent) return;

      let cancelled = false;
      const state = createControllable<number | undefined>({
        controlled: extent,
        /* `undefined` is a value of this state — the panel on its size step —
           and not a gap to fill: a floor standing in for it made a request for
           the floor from the content stop look like no change at all. */
        initial: currentExtent,
        onRequest: (raw) => {
          cancelled = raw.cancelled;
          onExtentChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            previous: raw.previous,
            reason,
            source: raw.source,
            value: raw.value,
          });
        },
      });

      const moved = state.request(wanted, reason, source);
      if (cancelled) return;
      if (moved) setOwnExtent(wanted);
    },
    [bounds.max, currentExtent, extent, onExtentChange],
  );

  useImperativeHandle<DrawerHandle, DrawerHandle>(
    ref,
    () => ({
      open: () => requestOpen(true, 'programmatic', undefined, undefined),
      close: (result?: string) => requestOpen(false, 'programmatic', result, undefined),
      focus: () => nodes.current.panel?.focus(),
      get panel() {
        return nodes.current.panel;
      },
    }),
    [requestOpen],
  );

  const value = useMemo<DrawerContextValue>(
    () => ({
      announce,
      close: (reason, result, source) => requestOpen(false, reason, result, source),
      container,
      descriptionId: descriptionRendered ? `${baseId}description` : '',
      dragging,
      drag: drag ?? defaults.drag,
      scrimFrom: scrimFrom ?? 0,
      live,
      setLive,
      rest,
      setRest,
      back: resolvedBack,
      escape: resolvedEscape,
      extent: currentExtent,
      finalFocus,
      initialFocus: initialFocus ?? 'first',
      loading: loading === true,
      defaultExtent,
      maxExtent: bounds.max,
      minExtent: bounds.min,
      modal: resolvedModal,
      mode: resolvedMode,
      mounted,
      mount: resolvedMount,
      nodes: nodes.current,
      open: currentOpen,
      openWith: (reason, source) => requestOpen(true, reason, undefined, source),
      outsidePress: resolvedOutsidePress,
      panelId: `${baseId}panel`,
      registerLayer,
      requestExtent,
      setDragging,
      side: resolvedSide,
      size: resolvedSize,
      snapPoints: resolvedSnapPoints,
      t,
      titleId: titleRendered ? `${baseId}title` : '',
      triggerId: `${baseId}trigger`,
      /** What the stylesheet keys on, which is a frame behind what was asked. */
      visible: resolvedMode === 'inline' ? currentOpen : status === 'open',
      interactive:
        resolvedMode === 'inline' ? currentOpen : status === 'entering' || status === 'open',
    }),
    [
      announce,
      baseId,
      bounds.max,
      bounds.min,
      container,
      currentExtent,
      defaultExtent,
      currentOpen,
      descriptionRendered,
      defaults.drag,
      drag,
      dragging,
      live,
      rest,
      scrimFrom,
      finalFocus,
      initialFocus,
      loading,
      mounted,
      registerLayer,
      requestExtent,
      requestOpen,
      resolvedBack,
      resolvedEscape,
      resolvedModal,
      resolvedMode,
      resolvedMount,
      resolvedOutsidePress,
      resolvedSide,
      resolvedSize,
      resolvedSnapPoints,
      status,
      t,
      titleRendered,
    ],
  );

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}
