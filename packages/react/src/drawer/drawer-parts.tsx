import { keyedProps } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import {
  anchorsAtStart,
  attachSheetScroll,
  addExtentSample,
  extentVelocity,
  EXTENT_LARGE_STEP_PX,
  EXTENT_STEP_PX,
  extentAtPoint,
  holdResizeGesture,
  isInlineSide,
  measureSheetStops,
  sameStop,
  settleExtent,
  SHEET_DRAG_SLOP_PX,
  SHEET_FLING_PX_PER_S,
  stopAsExtent,
  stepAmountFromPixels,
  stepExtent,
} from '@slotted/core/extent';
import type { ExtentSample, SheetScroll } from '@slotted/core/extent';
import { createFocusScope } from '@slotted/core/focus';
import { clamp, observeKeyboardInset } from '@slotted/core/measure';
import { createPortalRoot } from '@slotted/core/portal';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Glyph, Icon } from '../icon';
import { useDrawer } from './drawer';
import type {
  DrawerActionsProps,
  DrawerBodyProps,
  DrawerCloseProps,
  DrawerContextValue,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerOpenReason,
  DrawerPanelProps,
  DrawerPanelRootProps,
  DrawerResizerProps,
  DrawerTitleProps,
  DrawerTriggerProps,
  DrawerTriggerRootProps,
} from './drawer.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is how `Enter`, `Space` and a pointer are told apart without
 * a key listener existing for something the platform already handles.
 */
function activationReason(event: MouseEvent): DrawerOpenReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** Layout on the client, and nothing at all on the server. */
const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

function isRtl(node: HTMLElement | null): boolean {
  return node !== null && getComputedStyle(node).direction === 'rtl';
}

/**
 * The box the panel's measure is a fraction of: the layer under `overlay`,
 * which is fixed to the viewport, and the drawer's own parent under `inline`,
 * where the drawer is what is being sized and cannot measure itself.
 */
function measuringBox(layer: HTMLElement | null, mode: DrawerContextValue['mode']) {
  if (layer === null) return null;
  if (mode !== 'inline') return layer;
  /* The layer sits in the `display: contents` boxes `DrawerPanel` moves it
     through, which lay nothing out: the box is the first ancestor past them. */
  let box = layer.parentElement;
  while (box !== null && HOSTS.has(box)) box = box.parentElement;
  return box;
}

/**
 * The `display: contents` boxes the layer is rendered through: the host it is
 * portalled into, and the anchor that holds the host in the consumer's layout
 * under `inline`. Neither lays anything out, so neither is measured.
 */
const HOSTS = new WeakSet<Element>();

const subscribeNothing = () => () => {};

/**
 * Whether this render is the client's own: `false` on the server and while
 * the client hydrates what the server wrote, `true` afterwards and from the
 * start of a tree the client mounts itself. Only the client can portal.
 */
function useClientRender(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/**
 * The control that opens the drawer.
 *
 * It stays where it is written while an overlay layer is portalled out, which
 * is why it is also the layer's *branch*: a press on it is inside the layer as
 * far as `dismissable-layer` is concerned, or opening would immediately be read
 * as an outside press and close what it just opened.
 *
 * `aria-haspopup` is written only under `mode="overlay"`. An inline drawer is a
 * disclosure, not a popup, and the property would promise a layer that never
 * arrives — a distinction none of the six surveyed implementations makes.
 */
export function DrawerTrigger({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  ...nativeProps
}: DrawerTriggerProps) {
  const drawer = useDrawer();

  const rootProps: DrawerTriggerRootProps = keyedProps({
    ...nativeProps,
    'aria-controls': drawer.mounted ? drawer.panelId : undefined,
    'aria-expanded': drawer.open,
    ...(drawer.mode === 'overlay' ? { 'aria-haspopup': 'dialog' as const } : {}),
    children,
    className,
    'data-part': 'trigger',
    ...(drawer.open ? { 'data-open': '' } : {}),
    id: drawer.triggerId,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      /* The consumer's handler runs first, and preventDefault() refuses the
         open — composed with, never replaced. */
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (drawer.open) drawer.close(activationReason(event), undefined, event);
      else drawer.openWith(activationReason(event), event);
    },
    ref: (node: HTMLButtonElement | null) => {
      drawer.nodes.trigger = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    style,
    type: 'button',
  });

  if (render !== undefined) return render(rootProps);
  return <button {...rootProps} />;
}

/** Where an overlay layer is placed, and what it inherits once it is there. */
function usePortalContainer(drawer: DrawerContextValue): Element | null {
  const [container, setContainer] = useState<Element | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (drawer.mode === 'inline' || !drawer.mounted) return;

    /**
     * The trigger is the origin, and that is a rule rather than a fallback: it
     * is the element the layer was opened from, so its region is the one whose
     * scheme, density, theme and direction the layer inherits. A layer opened
     * from code has no trigger, and the document is then the honest origin.
     *
     * Angular has it better — `<sl-drawer>`'s host element is written in place,
     * so its own parent is the origin whether a trigger exists or not — and the
     * design document records the asymmetry rather than levelling both down.
     */
    const root = createPortalRoot({
      origin: drawer.nodes.trigger,
      ...(drawer.container === undefined ? {} : { container: drawer.container }),
    });
    setContainer(root.container);

    return () => {
      setContainer(null);
      root.release();
    };
  }, [drawer.container, drawer.mode, drawer.mounted, drawer.nodes]);

  return container;
}

/**
 * The measure as a length the stylesheet can use.
 *
 * The public value is a fraction, because that is what the separator's three
 * ARIA values, the limits and the snap points all are. What CSS needs is a
 * length, and a percentage would not do: under `inline` the drawer *is* the box
 * being sized, so a percentage of its own containing block resolves against a
 * track whose size depends on it. The fraction is turned into pixels against
 * the measuring box, and a `ResizeObserver` keeps the two in step so a window
 * resize cannot leave the panel and its reported value disagreeing.
 */
function useExtentLength(
  drawer: DrawerContextValue,
  layer: HTMLElement | null,
): string | undefined {
  const [length, setLength] = useState<string | undefined>(undefined);
  const { mode, side } = drawer;
  /* The hand's position while the body is dragged, and the state otherwise. */
  const extent = drawer.live ?? drawer.extent;

  useIsomorphicLayoutEffect(() => {
    const box = measuringBox(layer, mode);
    if (box === null || extent === undefined) {
      setLength(undefined);
      return;
    }

    const measure = () => {
      const rect = box.getBoundingClientRect();
      const span = isInlineSide(side) ? rect.width : rect.height;
      if (span > 0) setLength(`${Math.round(extent * span)}px`);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [extent, layer, mode, side]);

  return length;
}

/** What the stylesheet leaves above a content sheet, for the press outside. */
const CONTENT_RESERVE = 'var(--slotted-space-12, 4rem)';

/** The stops a sheet rests on and the rest among them, measured now. */
function measureStops(drawer: DrawerContextValue, panel: HTMLElement, span: number) {
  return measureSheetStops({
    atRest: drawer.extent === undefined && drawer.live === null,
    content: drawer.size === 'content',
    panel,
    reserve: CONTENT_RESERVE,
    rest: drawer.rest,
    snapPoints: drawer.snapPoints,
    span,
  });
}

/** How long a close by the hand waits before it reads the consumer's refusal. */
const REFUSED_CLOSE_MS = 300;

/** The scroll of each open sheet, for the separator inside it. */
const sheetScrolls = new WeakMap<HTMLElement, SheetScroll>();

function asRequest(drawer: DrawerContextValue, fraction: number, rest: number | undefined) {
  return stopAsExtent(fraction, rest, drawer.size === 'content');
}

/**
 * The layer, the scrim and the panel.
 *
 * Two boxes rather than `dialog`'s three. That family needs a viewport between
 * its layer and its panel because its root declares `container-type:
 * inline-size`, which applies `contain: layout`, which makes a scrim positioned
 * inside a scrolling root part of what scrolls. This root declares no container
 * and never scrolls: the panel is pinned to an edge and bounded to the layer by
 * construction, so the scrim and the panel are two cells of one grid.
 *
 * `render` substitutes the **panel**, not the layer. That is the element a
 * consumer needs to change: an inline navigation drawer is a `<nav>` and a
 * filter panel is an `<aside>`, and the family cannot know which.
 */
export function DrawerPanel({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: DrawerPanelProps) {
  const drawer = useDrawer();
  const portal = usePortalContainer(drawer);
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const extentLength = useExtentLength(drawer, layer);

  const overlay = drawer.mode === 'overlay';
  const client = useClientRender();

  /**
   * One element the layer is always portalled into, in both modes, and which
   * is itself moved: into the anchor below under `inline`, into the portal
   * root under `overlay`. A portal into a different container, or a portal in
   * place of an element, is a different subtree to React, and switching `mode`
   * then destroyed the panel's fields, scroll position and focus — the cost the
   * axis exists to avoid (contract `mode.reason`). Moving the container keeps
   * the subtree, as Angular keeps it by moving the layer element.
   */
  const [host] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const node = document.createElement('div');
    node.style.display = 'contents';
    HOSTS.add(node);
    return node;
  });
  const placeHost = useCallback(
    (anchor: HTMLDivElement | null) => {
      if (anchor === null || host === null) return;
      HOSTS.add(anchor);
      /* An overlay layer waiting for its portal root stays where it is for
         that one render, rather than being unmounted and built again. */
      if (!overlay) anchor.append(host);
      else if (portal !== null) portal.append(host);
    },
    [host, overlay, portal],
  );
  /* Whether the layer is in the host now, so a switch to `overlay` holds it
     there until the portal root exists instead of dropping it. */
  const portalled = useRef(false);
  const inHost =
    client && host !== null && drawer.mounted && (!overlay || portal !== null || portalled.current);
  useIsomorphicLayoutEffect(() => {
    portalled.current = inHost;
  });
  /* Where the layer is now: what it stands over, what it makes inert and
     where focus goes all depend on it. */
  const placed = !overlay || portal !== null;
  /* An inline panel writes no role, and a name on a generic element names
     nothing: the consumer's landmark around it carries the name, unless the
     consumer gave the panel a role of its own. */
  const labelled =
    drawer.titleId !== '' &&
    nativeProps['aria-label'] === undefined &&
    (overlay || nativeProps.role !== undefined);

  /**
   * One stable callback, because an inline one is re-run with `null` on every
   * render and `presence` reads that as the exit being over. See
   * `registerLayer` in `drawer.tsx` for what it cost.
   */
  const { registerLayer } = drawer;
  const attachLayer = useCallback(
    (node: HTMLDivElement | null) => {
      setLayer(node);
      registerLayer(node);
    },
    [registerLayer],
  );

  /* The latest context, for listeners that live across renders. */
  const current = useRef(drawer);
  current.current = drawer;

  /**
   * Everything the drawer does while it is open, taken down when it closes
   * rather than when the node unmounts — `presence` keeps the node mounted
   * through the exit, and a layer still holding the scroll lock and the
   * background's `inert` for those milliseconds is a page nobody can touch.
   *
   * It is keyed on the values that decide the layer, and on nothing else. The
   * context object is a new one whenever anything in it changes — the measured
   * rest once the panel has laid out, a drag, `loading` — and an effect keyed
   * on it tore the scope down and entered it again on every such render,
   * reading the element to give focus back to from inside the panel. Closing
   * then gave focus to a control on its way out, and the reader landed on
   * `body`. What it calls later is read from `current`.
   */
  useEffect(() => {
    if (panel === null || layer === null || !drawer.open || !placed) return;

    const branches = drawer.nodes.trigger === null ? [] : [drawer.nodes.trigger];
    const dismissable = overlay
      ? /* The panel is what a press is inside of; the scrim is the way out, on
           the click rather than the pointerdown so a selection dragged out of
           the panel is not a press on the scrim. */
        createDismissableLayer(layer, {
          /* A history entry is a modal layer's: a layer the page stays
             reachable under has no claim on the way back. */
          back: drawer.modal && drawer.back === 'close',
          branches,
          content: panel,
          escape: drawer.escape === 'close',
          modal: drawer.modal,
          onDismiss: (request) => {
            if (request.reason === 'outsidePress' && current.current.outsidePress === 'none') {
              return request.cancel();
            }
            current.current.close(request.reason as DrawerOpenReason, undefined, request.source);
          },
          outsidePress: drawer.outsidePress === 'close',
          outsidePressEvent: 'click',
        })
      : null;

    /**
     * An inline drawer contains nothing and moves nothing on open: a sidebar
     * that stole focus every time a breakpoint crossed would be unusable, and
     * Angular Material makes the same split. It still *restores*, because the
     * scope moves focus back only when focus is inside it or on the body — so
     * closing a drawer the reader is standing in returns them to the trigger,
     * and closing one they had already left moves nothing.
     */
    const wanted = drawer.initialFocus;
    const returnTo = drawer.finalFocus;
    /**
     * Where focus goes back to with no `finalFocus`: what held it when the
     * drawer opened, or the trigger when that was nothing. A click does not
     * focus a button in Safari, so a drawer opened from its trigger there had
     * `body` as its origin and gave focus back to nowhere.
     */
    const origin = panel.ownerDocument.activeElement as HTMLElement | null;
    const originParent = origin?.parentElement ?? null;
    const fallback = (): HTMLElement | null => {
      if (origin === null || origin === origin.ownerDocument.body)
        return current.current.nodes.trigger;
      if (origin.isConnected) return origin;
      /* The row the drawer was opened from has gone: its nearest ancestor that
         is still in the document, as the contract's restore rule says. */
      let node: HTMLElement | null = originParent;
      while (node !== null && !node.isConnected) node = node.parentElement;
      return node;
    };
    const scope = createFocusScope(panel, {
      contain: overlay && drawer.modal,
      initial: !overlay
        ? false
        : typeof wanted === 'object' && wanted !== null
          ? () => wanted.current
          : wanted,
      restore:
        returnTo === undefined
          ? fallback
          : returnTo === false
            ? (false as const)
            : () => returnTo.current,
    });
    scope.enter();

    return () => {
      /* The layer first: while it stands, a modal layer keeps every sibling up
         to the root `inert`, and focus given back to a trigger there is
         refused — the reader lands on `body`. */
      dismissable?.destroy();
      scope.destroy();
    };
  }, [
    drawer.back,
    drawer.escape,
    drawer.finalFocus,
    drawer.initialFocus,
    drawer.modal,
    drawer.open,
    drawer.outsidePress,
    layer,
    overlay,
    panel,
    placed,
  ]);

  /**
   * What the panel measures at rest, as a fraction, while nothing has moved
   * it. It is what the separator reports as its value and what `scrimFrom`
   * compares against, and content that arrives while the sheet is open moves
   * it, so it is observed rather than read once.
   */
  const {
    setRest,
    open: isOpen,
    extent: extentValue,
    live: liveValue,
    dragging: draggingValue,
  } = drawer;
  useIsomorphicLayoutEffect(() => {
    const box = measuringBox(layer, drawer.mode);
    if (
      panel === null ||
      box === null ||
      !isOpen ||
      extentValue !== undefined ||
      liveValue !== null ||
      draggingValue
    )
      return;
    const inline = isInlineSide(drawer.side);
    const read = () => {
      /* A sheet's panel is as tall as its content; its rest is the scroll's. */
      if (sheetScrolls.has(panel)) return;
      const rect = box.getBoundingClientRect();
      const span = inline ? rect.width : rect.height;
      if (span <= 0) return;
      const own = inline ? panel.offsetWidth : panel.offsetHeight;
      setRest(Math.round((own / span) * 1000) / 1000);
    };
    /* The observer's first report arrives after the layout that placed the
       panel, so reading there lays nothing out; a read here, in the commit
       that mounted the panel, forced that layout early. */
    if (typeof ResizeObserver === 'undefined') {
      read();
      return;
    }
    const observer = new ResizeObserver(read);
    observer.observe(panel);
    observer.observe(box);
    return () => observer.disconnect();
  }, [
    layer,
    drawer.mode,
    drawer.side,
    draggingValue,
    extentValue,
    isOpen,
    liveValue,
    panel,
    setRest,
  ]);

  /**
   * The virtual keyboard. The layer recedes by what it covers, so the panel
   * lands above the keys; `@slotted/core/measure` reads it from the visual
   * viewport.
   */
  useEffect(() => {
    if (!overlay || layer === null || !isOpen) return;
    const stop = observeKeyboardInset(layer.ownerDocument.defaultView, (pixels) => {
      if (pixels === 0) layer.style.removeProperty('--slotted-keyboard-inset');
      else layer.style.setProperty('--slotted-keyboard-inset', `${pixels}px`);
    });
    return () => {
      stop();
      layer.style.removeProperty('--slotted-keyboard-inset');
    };
  }, [isOpen, layer, overlay]);

  /**
   * A sheet from the bottom is moved by the platform's own scroll: the layer
   * scrolls, and its `scrollTop` is how much of the panel is in sight
   * (`attachSheetScroll`). The finger, the fling and the landing are the
   * compositor's; the family reads where the scroll came to rest and asks for
   * that extent, or for the close.
   */
  const sheet = overlay && drawer.side === 'bottom';
  const sheetScroll = useRef<SheetScroll | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (!sheet || panel === null || layer === null) return;
    const scroll = attachSheetScroll(layer, panel, {
      content: () => current.current.size === 'content',
      dismissible: () => true,
      onScroll: (at) => {
        const drawerNow = current.current;
        if (drawerNow.scrimFrom > 0)
          layer.toggleAttribute('data-undimmed', at < drawerNow.scrimFrom);
      },
      onSettle: (at) => {
        const drawerNow = current.current;
        if (!drawerNow.open) return;
        if (at === 'close') {
          drawerNow.close('pointer', undefined, null);
          /* A close the consumer refused puts the sheet back where it rests. The
             answer is read once a render has had time to land: a frame later
             the state of an accepted close is not there yet, and reading it
             then brought a closing sheet back up. */
          setTimeout(() => {
            if (current.current.open && scroll.at() === 0) scroll.scrollTo(scroll.rest(), true);
          }, REFUSED_CLOSE_MS);
          return;
        }
        drawerNow.requestExtent(asRequest(drawerNow, at, scroll.rest()), 'pointer', null);
      },
      reserve: CONTENT_RESERVE,
      snapPoints: () => current.current.snapPoints,
      step: 'var(--_step)',
    });
    sheetScroll.current = scroll;
    sheetScrolls.set(panel, scroll);
    return () => {
      scroll.destroy();
      sheetScroll.current = null;
      sheetScrolls.delete(panel);
    };
  }, [layer, panel, sheet]);

  /**
   * Opening scrolls the sheet up from out of sight to its resting stop, and
   * closing other than by the hand scrolls it back down, in the drawer's slide
   * tokens both ways, the motion a released drag ends with.
   */
  const interactive = drawer.interactive;
  const wasOpen = useRef(false);
  useIsomorphicLayoutEffect(() => {
    const scroll = sheetScroll.current;
    if (scroll === null || panel === null || layer === null) return;
    if (isOpen && interactive && !wasOpen.current) {
      wasOpen.current = true;
      scroll.enter(current.current.extent);
    } else if (!isOpen && wasOpen.current) {
      wasOpen.current = false;
      if (scroll.at() > 0) scroll.scrollTo(0, true);
    }
  }, [interactive, isOpen, layer, panel]);

  /* A measure asked for by the keyboard, the grabber or the consumer is scrolled to. */
  useEffect(() => {
    const scroll = sheetScroll.current;
    /* An opening reads and writes in frames of its own; it scrolls to the extent itself. */
    if (scroll === null || panel === null || layer === null || !isOpen || scroll.busy()) return;
    const wanted = extentValue ?? scroll.rest();
    if (Math.abs(scroll.at() - wanted) * layer.clientHeight > 2) scroll.scrollTo(wanted, true);
  }, [extentValue, isOpen, layer, panel]);

  if (!drawer.mounted) return null;
  /* The server, and the hydration of what it wrote, cannot portal: an overlay
     layer has nowhere to be yet, and an inline one is written in place, inside
     the anchor it is moved through once the client renders. */
  if (!client || host === null) {
    if (overlay) return null;
  } else if (!inHost) return null;

  /* A sheet that spans the layer is the screen: the stylesheet squares its
     top corners and clears the safe area above its header. */
  const expanded =
    overlay &&
    drawer.side === 'bottom' &&
    (drawer.size === 'full' || (drawer.extent !== undefined && sameStop(drawer.extent, 1)));

  const panelProps: DrawerPanelRootProps = keyedProps({
    ...nativeProps,
    ...(drawer.descriptionId === '' ? {} : { 'aria-describedby': drawer.descriptionId }),
    ...(labelled ? { 'aria-labelledby': drawer.titleId } : {}),
    ...(drawer.modal ? { 'aria-modal': true } : {}),
    children,
    className,
    'data-part': 'panel',
    id: drawer.panelId,
    ref: (node: HTMLDivElement | null) => {
      setPanel(node);
      drawer.nodes.panel = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    /* Under `inline` the panel is a region of the page rather than a window
       over it, so it writes no role: a navigation drawer is a navigation
       landmark and a filter panel is complementary, and a family that cannot
       know which one guesses wrong half the time. `render` is how a consumer
       says which. */
    ...(overlay ? { role: 'dialog' as const } : {}),
    style,
  });

  const layerNode: ReactNode = (
    <div
      data-mode={drawer.mode}
      data-mount={drawer.mount}
      data-part="root"
      data-part-root=""
      data-side={drawer.side}
      data-size={drawer.size}
      data-ui="drawer"
      data-ui-drawer=""
      {...(drawer.dragging ? { 'data-dragging': '' } : {})}
      {...(overlay && drawer.side === 'bottom' ? { 'data-drag': drawer.drag } : {})}
      {...(expanded ? { 'data-expanded': '' } : {})}
      {...(overlay && (drawer.live ?? drawer.extent ?? drawer.rest ?? 1) < drawer.scrimFrom
        ? { 'data-undimmed': '' }
        : {})}
      {...(drawer.loading ? { 'data-loading': '' } : {})}
      {...(drawer.modal ? { 'data-modal': '' } : {})}
      {...(drawer.interactive ? {} : { inert: true })}
      {...(drawer.visible ? { 'data-open': '' } : {})}
      ref={attachLayer}
      style={
        extentLength === undefined
          ? undefined
          : ({ '--slotted-drawer-extent': extentLength } as CSSProperties)
      }
    >
      {/* The scrim belongs to the layer, not to the dismissal policy: `modal`
          decides what happens to the page behind it and never what is painted.
          `dialog` draws it the same way, and a consumer who wants none sets
          `--slotted-drawer-scrim: transparent`. */}
      {overlay ? <div data-part="backdrop" data-part-backdrop="" /> : null}
      {render === undefined ? <div {...panelProps} /> : render(panelProps)}
    </div>
  );

  if (!client || host === null) return <div style={ANCHOR_STYLE}>{layerNode}</div>;

  return (
    <>
      <div ref={placeHost} style={ANCHOR_STYLE} />
      {createPortal(layerNode, host)}
    </>
  );
}

const ANCHOR_STYLE: CSSProperties = { display: 'contents' };

/**
 * The separator the reader moves, from the WAI-ARIA Window Splitter pattern.
 *
 * **Rendering it is the capability.** There is no `resizable` prop, so a prop
 * with no separator, and a separator a prop had switched off, are both states
 * this family cannot be in.
 *
 * The arrows are physical rather than logical, which is the pattern's own
 * reading: the key names a direction on the screen. `ArrowLeft` grows an
 * `end`-side panel in a left-to-right document and shrinks it in a mirrored
 * one, because there the panel is on the left and the reader is pushing its
 * edge toward the wall.
 */
/** How far a press on the separator may wander and still be a tap. */
const TAP_SLOP_PX = 3;

export function DrawerResizer({
  className,
  largeStep = EXTENT_LARGE_STEP_PX,
  onDoubleClick,
  onKeyDown,
  onPointerDown,
  ref,
  render,
  step = EXTENT_STEP_PX,
  style,
  ...rest
}: DrawerResizerProps) {
  const drawer = useDrawer();
  const node = useRef<HTMLDivElement | null>(null);
  /** Where the pointer last was, which is what decides a dismissal on release. */
  const dragged = useRef<number | null>(null);
  /** Where the pointer has been, for the velocity the release reads. */
  const samples = useRef<ExtentSample[]>([]);
  /**
   * Where the press began and how far the panel's edge was from the pointer
   * then. The panel follows the pointer from that offset rather than jumping
   * its edge under it, so a press that does not move is a tap and moves nothing.
   */
  const press = useRef<{
    x: number;
    y: number;
    offset: number;
    moved: boolean;
    /** The measure before the gesture, which a close by the gesture gives back. */
    before: number | undefined;
  } | null>(null);
  /** What `Enter` restores to once it has collapsed the panel. */
  const restore = useRef<number | null>(null);
  /** What the document looked like before the drag, and how to put it back. */
  const gesture = useRef<(() => void) | null>(null);
  /** A press on a sheet's separator: a tap, or a mouse dragging the sheet's scroll. */
  const sheetPress = useRef<{
    x: number;
    y: number;
    mouse: boolean;
    scroll: SheetScroll;
    drag: ReturnType<SheetScroll['drag']> | null;
  } | null>(null);

  /** The drawer as the last render saw it, for what a frame after the release reads. */
  const latest = useRef(drawer);
  latest.current = drawer;

  const inline = isInlineSide(drawer.side);
  const current = drawer.live ?? drawer.extent ?? drawer.rest ?? drawer.minExtent;
  const percent = (value: number) => Math.round(clamp(value, 0, 1) * 100);

  const layerRect = () => {
    const box = measuringBox(drawer.nodes.layer, drawer.mode);
    return box === null ? null : box.getBoundingClientRect();
  };

  /**
   * The stops the keyboard, the release and a tap share. Without snap points
   * the range is continuous and there are none — the content stop joins only a
   * list the consumer started, or a separator with no stops would stop moving.
   */
  const stopsNow = (): { stops: number[]; rest: number | undefined } => {
    const panel = drawer.nodes.panel;
    /* A sheet's stops are the scroll's, laid out with its snap points. */
    const scroll = panel === null ? undefined : sheetScrolls.get(panel);
    if (scroll !== undefined) return { rest: scroll.rest(), stops: [...scroll.stops()] };
    const rect = layerRect();
    if (panel === null || rect === null || drawer.snapPoints.length === 0) {
      return { rest: drawer.rest, stops: [] };
    }
    return measureStops(drawer, panel, inline ? rect.width : rect.height);
  };

  const move = (fraction: number, source: unknown) => {
    dragged.current = fraction;
    drawer.requestExtent(fraction, 'pointer', source);
  };

  const pointAt = (event: { clientX: number; clientY: number }, rect: DOMRect) =>
    extentAtPoint({
      point: { x: event.clientX, y: event.clientY },
      rect,
      rtl: isRtl(node.current),
      side: drawer.side,
    });

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || event.button !== 0) return;

    /* A sheet's separator: a touch that moves is the scroll's, one that does
       not is a tap; a mouse, which no scroll follows, drags the scroll. */
    const scroll = drawer.nodes.panel === null ? undefined : sheetScrolls.get(drawer.nodes.panel);
    if (scroll !== undefined) {
      const mouse = event.pointerType === 'mouse';
      if (mouse) {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.currentTarget.focus();
      sheetPress.current = { drag: null, mouse, scroll, x: event.clientX, y: event.clientY };
      return;
    }

    const rect = layerRect();
    if (rect === null) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    press.current = {
      before: drawer.extent,
      moved: false,
      offset: current - pointAt(event, rect),
      x: event.clientX,
      y: event.clientY,
    };
    samples.current = [];
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const tapped = sheetPress.current;
    if (tapped !== null) {
      const travel = Math.hypot(event.clientX - tapped.x, event.clientY - tapped.y);
      if (tapped.drag === null && travel < (tapped.mouse ? TAP_SLOP_PX : SHEET_DRAG_SLOP_PX))
        return;
      if (!tapped.mouse) {
        sheetPress.current = null;
        return;
      }
      tapped.drag ??= tapped.scroll.drag();
      tapped.drag.move(tapped.y - event.clientY);
      return;
    }
    const held = press.current;
    if (held === null) return;
    const rect = layerRect();
    if (rect === null) return;

    if (!held.moved) {
      if (Math.hypot(event.clientX - held.x, event.clientY - held.y) < TAP_SLOP_PX) return;
      held.moved = true;
      /* The cursor has to survive the pointer leaving the separator, and a drag
         across the page must not select the text under it. Both are the
         document's and neither is reachable from the family's own stylesheet. */
      gesture.current?.();
      gesture.current = holdResizeGesture(
        node.current?.ownerDocument,
        inline ? 'col-resize' : 'row-resize',
      );
      drawer.setDragging(true);
    }

    const fraction = clamp(pointAt(event, rect) + held.offset, 0, 1);
    samples.current = addExtentSample(samples.current, { at: event.timeStamp, fraction });
    move(fraction, event);
  };

  /**
   * A tap walks the stops upward and wraps from the highest to the lowest,
   * which is what the grabber of a native sheet does and what Ionic calls
   * `handleBehavior="cycle"`. A separator with no stops has nowhere to walk.
   */
  const cycle = (event: PointerEvent<HTMLDivElement>) => {
    const { rest: measuredRest, stops } = stopsNow();
    if (stops.length < 2) return;
    /* Where the panel is, read with the stops rather than from state a frame old. */
    const scroll = drawer.nodes.panel === null ? undefined : sheetScrolls.get(drawer.nodes.panel);
    const at = scroll?.at() ?? drawer.live ?? drawer.extent ?? measuredRest ?? current;
    const next = stops.find((stop) => stop > at && !sameStop(stop, at)) ?? (stops[0] as number);
    drawer.requestExtent(asRequest(drawer, next, measuredRest), 'pointer', event);
  };

  /**
   * Where the release lands. With stops it is `settleExtent`, the same rule
   * the sheet's body answers: the closed position is the stop `0`, a fling goes
   * to the next stop, anything slower to the nearest to where it was heading.
   * Without stops the range is continuous — resizing is what a separator does
   * on a desktop screen — and only the floor, or a fling toward the edge, asks
   * to close. A close the consumer cancels leaves the panel at the floor.
   */
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const tapped = sheetPress.current;
    if (tapped !== null) {
      sheetPress.current = null;
      if (tapped.drag !== null) tapped.drag.end();
      else if (event.type === 'pointerup') cycle(event);
      return;
    }
    const held = press.current;
    if (held === null) return;
    press.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!held.moved) {
      if (event.type === 'pointerup') cycle(event);
      return;
    }

    gesture.current?.();
    gesture.current = null;
    drawer.setDragging(false);

    const rect = layerRect();
    const span = rect === null ? 0 : inline ? rect.width : rect.height;
    const last = dragged.current ?? current;
    /* A cancelled pointer was not let go: it has no speed to carry on. */
    const velocity =
      event.type === 'pointercancel' ? 0 : extentVelocity(samples.current, event.timeStamp);
    dragged.current = null;
    samples.current = [];

    const { rest: measuredRest, stops } = stopsNow();
    /* Where the release lands: a stop, the floor, or out. */
    const landed: number | 'close' =
      stops.length > 0
        ? settleExtent({ fraction: last, span, stops, velocity })
        : last < drawer.minExtent || velocity * span <= -SHEET_FLING_PX_PER_S
          ? 'close'
          : clamp(last, drawer.minExtent, drawer.maxExtent);

    if (landed === 'close') {
      const floor = stops.length > 0 ? (stops[0] as number) : drawer.minExtent;
      drawer.close('pointer', undefined, event);
      /* The next open starts at the measure the drawer had before the gesture,
         which a separator resizing as it moved has to ask back. A close the
         consumer refused leaves the panel open, at the floor. */
      drawer.requestExtent(held.before, 'pointer', event);
      requestAnimationFrame(() => {
        if (latest.current.open) latest.current.requestExtent(floor, 'pointer', event);
      });
      return;
    }
    drawer.requestExtent(
      stops.length > 0 ? asRequest(drawer, landed, measuredRest) : landed,
      'pointer',
      event,
    );
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const atStart = anchorsAtStart(drawer.side, isRtl(node.current));
    const towardFirstEdge = inline ? 'ArrowLeft' : 'ArrowUp';
    const towardLastEdge = inline ? 'ArrowRight' : 'ArrowDown';

    /**
     * A distance and not a proportion. Five per cent of a twelve-hundred-pixel
     * layer is sixty pixels, which is a jump rather than an adjustment; the
     * fraction is still what the family stores, and the pixels are converted
     * against the layer measured at the moment of the press.
     */
    const by = (direction: 1 | -1) => {
      event.preventDefault();
      const rect = layerRect();
      const amount =
        rect === null
          ? 0
          : stepAmountFromPixels({
              pixels: event.shiftKey ? largeStep : step,
              rect,
              side: drawer.side,
            });
      const { rest: measuredRest, stops } = stopsNow();
      const next = stepExtent({
        amount,
        direction,
        fraction: current,
        max: stops.at(-1) ?? drawer.maxExtent,
        min: stops[0] ?? drawer.minExtent,
        snapPoints: stops,
      });
      drawer.requestExtent(asRequest(drawer, next, measuredRest), 'keyboard', event);
    };

    /** The two ends of the range: the first and last stop when there are stops. */
    const to = (end: 'first' | 'last') => {
      event.preventDefault();
      const { rest: measuredRest, stops } = stopsNow();
      const target =
        end === 'first' ? (stops[0] ?? drawer.minExtent) : (stops.at(-1) ?? drawer.maxExtent);
      drawer.requestExtent(asRequest(drawer, target, measuredRest), 'keyboard', event);
    };

    switch (event.key) {
      case towardFirstEdge:
        return by(atStart ? -1 : 1);
      case towardLastEdge:
        return by(atStart ? 1 : -1);
      case 'Home':
        return to('first');
      case 'End':
        return to('last');
      /**
       * The pattern's own key, and the one departure from it: "collapses the
       * pane" would mean closing the drawer, and Escape already means that. A
       * reader who presses Enter on a separator expects the separator to still
       * be there afterwards.
       */
      case 'Enter': {
        event.preventDefault();
        if (current > drawer.minExtent) {
          restore.current = current;
          return drawer.requestExtent(drawer.minExtent, 'keyboard', event);
        }
        return drawer.requestExtent(restore.current ?? drawer.maxExtent, 'keyboard', event);
      }
      default:
        return;
    }
  };

  /**
   * Back to the measure the size step gives it, which is what `undefined`
   * means for this state. It is the one gesture in the family that restores
   * rather than moves, and every desktop pane divider answers a double click
   * with it.
   */
  const doubleClick = (event: MouseEvent<HTMLDivElement>) => {
    onDoubleClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    drawer.requestExtent(drawer.defaultExtent, 'pointer', event);
  };

  /* A content sheet may rest below `minExtent`, and its rest is still a value
     the range holds. */
  const floor =
    drawer.size === 'content' && drawer.rest !== undefined
      ? Math.min(drawer.minExtent, drawer.rest)
      : drawer.minExtent;

  const rootProps = keyedProps({
    'aria-controls': drawer.panelId,
    ...(drawer.titleId === '' ? {} : { 'aria-labelledby': drawer.titleId }),
    'aria-orientation': (inline ? 'vertical' : 'horizontal') as 'vertical' | 'horizontal',
    'aria-valuemax': percent(drawer.maxExtent),
    'aria-valuemin': percent(floor),
    'aria-valuenow': percent(clamp(current, floor, drawer.maxExtent)),
    ...rest,
    className,
    'data-part': 'resizer' as const,
    onDoubleClick: doubleClick,
    onKeyDown: keyDown,
    onLostPointerCapture: endDrag,
    onPointerCancel: () => {
      sheetPress.current = null;
    },
    onPointerDown: pointerDown,
    onPointerMove: pointerMove,
    onPointerUp: endDrag,
    role: 'separator' as const,
    style,
    tabIndex: 0,
  });

  const attach = (element: HTMLDivElement | null) => {
    node.current = element;
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
  };

  /**
   * The separator's own picture, and the reason it is three elements rather
   * than a pseudo-element: `packages/styles/src/fallbacks.test.mjs` forbids a
   * system colour inside `::before` or `::after`, and both steps these take
   * have one as their last resort.
   *
   * Which picture is the stylesheet's decision, by `data-side`: two hairlines
   * and a grip on an inline side, a pill on a block one.
   */
  const picture = (
    <>
      <span aria-hidden="true" data-part="line" data-part-line="" />
      <span aria-hidden="true" data-part="grip" data-part-grip="" />
      <span aria-hidden="true" data-part="line" data-part-line="" />
    </>
  );

  if (render !== undefined)
    return render({ ...rootProps, children: picture, ref: attach } as never);
  return (
    <div {...rootProps} ref={attach}>
      {picture}
    </div>
  );
}

export function DrawerHeader({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DrawerHeaderProps) {
  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'header' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <header {...rootProps} ref={ref} />;
}

/** The visible name, which `aria-labelledby` points at — on the panel and, as
 *  the Window Splitter pattern requires, on the separator that sizes it. */
export function DrawerTitle({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DrawerTitleProps) {
  const drawer = useDrawer();
  useEffect(() => drawer.announce('title'), [drawer]);

  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'title' as const,
    id: drawer.titleId === '' ? undefined : drawer.titleId,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <h2 {...rootProps} ref={ref} />;
}

/** The actions beside the title, on its row: one or two icon buttons, such as "history" and "new". */
export function DrawerActions({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DrawerActionsProps) {
  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'actions' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** The sentence that says what the drawer is about. */
export function DrawerDescription({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DrawerDescriptionProps) {
  const drawer = useDrawer();
  useEffect(() => drawer.announce('description'), [drawer]);

  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'description' as const,
    id: drawer.descriptionId === '' ? undefined : drawer.descriptionId,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <p {...rootProps} ref={ref} />;
}

/**
 * The one row that scrolls, and the row `aria-busy` belongs to while the
 * content is still on its way — the header, the close button, Escape and the
 * separator all stay operable, because a drawer a reader cannot leave is the
 * worse failure of the two.
 */
export function DrawerBody({
  children,
  className,
  inset,
  ref,
  render,
  style,
  ...rest
}: DrawerBodyProps) {
  const drawer = useDrawer();
  const rootProps = keyedProps({
    ...rest,
    ...(drawer.loading ? { 'aria-busy': true } : {}),
    children,
    className,
    ...(inset === undefined ? {} : { 'data-inset': inset }),
    'data-part': 'body' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

export function DrawerFooter({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DrawerFooterProps) {
  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'footer' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <footer {...rootProps} ref={ref} />;
}

/**
 * The ✕ in the corner. It carries `dismiss`, which is the word the closed
 * vocabulary in `docs/state-and-events.md` already has for what a close button
 * means, and its `value` rides out on the request as the result.
 */
export function DrawerClose({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  value,
  ...rest
}: DrawerCloseProps) {
  const drawer = useDrawer();

  const rootProps = keyedProps({
    'aria-label': drawer.t('close'),
    ...rest,
    /* The cross is drawn unless the consumer wrote content of their own. */
    children: children ?? (
      <Icon>
        <Glyph name="x" />
      </Icon>
    ),
    className,
    'data-part': 'close' as const,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      drawer.close('dismiss', value, event);
    },
    style,
    type: 'button' as const,
  });
  if (render !== undefined) return render(rootProps);
  return <button {...rootProps} ref={ref} />;
}
