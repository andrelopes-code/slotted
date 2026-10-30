import '@slotted/styles/tour/tour.css';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissReason, DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createFocusScope, tabbables } from '@slotted/core/focus';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { tourMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  cardFits,
  compactSide,
  createTourController,
  isCompactViewport,
  isTextEntry,
  keepOverTarget,
  resolveTarget,
  stageStep,
  tourKey,
  tourProgress,
  watchTarget,
  writeTargetRect,
} from '@slotted/core/tour';
import type { ResolvedStep, SpotMove, TourNavigationReason, TourOutcome } from '@slotted/core/tour';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useMessages } from '../i18n';
import { useTourDefaults } from './tour-defaults';
import {
  TourBody,
  TourClose,
  TourContent,
  TourDescription,
  TourFooter,
  TourHeader,
  TourMedia,
  TourNext,
  TourPrev,
  TourProgress,
  TourSkip,
  TourTitle,
} from './tour-parts';
import type {
  TourContextValue,
  TourFocusTarget,
  TourOpenReason,
  TourProps,
  TourState,
  TourStep,
} from './tour.types';

const TourContext = createContext<TourContextValue | undefined>(undefined);

/** What the tour around this part says. A part outside one has nothing to show. */
export function useTourContext(): TourContextValue {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('Every Tour part has to be inside a Tour.');
  }
  return context;
}

/**
 * The current step, where the reader is, and the four moves, for a consumer
 * composing the card themselves — the dots Ant Design draws, an action of the
 * product's own beside Next.
 */
export function useTour<Step extends TourStep = TourStep>(): TourState<Step> {
  return useTourContext() as unknown as TourState<Step>;
}

function resolveFocus(target: TourFocusTarget | undefined, doc: Document): HTMLElement | null {
  if (target === undefined) return null;
  if (typeof target === 'string') return doc.querySelector<HTMLElement>(target);
  if (target instanceof Element) return target as HTMLElement;
  return (target.current as HTMLElement | null) ?? null;
}

function directionOf(node: Element): 'ltr' | 'rtl' {
  const declared = node.closest('[dir]')?.getAttribute('dir');
  if (declared === 'rtl' || declared === 'ltr') return declared;
  return node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';
}

/** A press from a real pointer carries a click count; one from Enter or Space does not. */
function pressReason(event: { detail: number }): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function eventReason(event: Event): TourNavigationReason {
  if (event instanceof KeyboardEvent) return 'keyboard';
  if (event instanceof MouseEvent) return event.detail === 0 ? 'keyboard' : 'pointer';
  return 'programmatic';
}

const DISMISS_REASONS: Record<DismissReason, TourOpenReason> = {
  back: 'back',
  blur: 'programmatic',
  escape: 'escape',
  outsidePress: 'outsidePress',
  programmatic: 'programmatic',
};

/**
 * A guided walk through an interface, one step at a time.
 *
 * The component owns two values — whether the tour is open and which step is
 * current — and `@slotted/core/tour` owns everything between a press and a
 * card: conditions, preparation, a target that arrives late or never. The
 * frame is portalled to the end of the document; a modal step makes the page
 * `inert` and keeps focus in the card, an interactive step leaves the page
 * reachable so the reader can operate the target.
 *
 * With no children it renders the whole card. With children, the consumer
 * arranges the parts, which read the current step from context.
 */
export function Tour<Step extends TourStep = TourStep>(props: TourProps<Step>) {
  const {
    align,
    alignOffset,
    arrow,
    arrowPadding,
    autoFocus,
    children,
    closeOnEscape,
    closeOnOutsidePress,
    collisionPadding,
    defaultOpen,
    defaultStep,
    keyboardNavigation,
    layout,
    messages,
    missing,
    modal,
    onOpenChange,
    onStepChange,
    open,
    ref,
    scrollIntoView,
    side,
    sideOffset,
    size,
    spotlight,
    step,
    steps,
    targetTimeout,
  } = props;

  const defaults = useTourDefaults();
  const base = useId();

  const [ownOpen, setOwnOpen] = useState<boolean>(defaultOpen ?? false);
  const [ownStep, setOwnStep] = useState<string | null>(defaultStep ?? null);
  const isOpen = open ?? ownOpen;
  const currentId = step !== undefined ? step : ownStep;

  const [shown, setShown] = useState<ResolvedStep<Step> | null>(null);
  /** The step whose card is drawn: it trails `shown` by the choreography of `stageStep`. */
  const [staged, setStaged] = useState<ResolvedStep<Step> | null>(null);
  /** The cutout's target and the movement that brings it there. */
  const [spot, setSpot] = useState<{ target: Element | null; move: SpotMove }>({
    target: null,
    move: 'rest',
  });
  const [leaving, setLeaving] = useState(false);
  /** The card of the staged step has been placed, and may be drawn. */
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  const [container, setContainer] = useState<Element | null>(null);
  const [rootNode, setRootNode] = useState<HTMLElement | null>(null);
  const [surfaceNode, setSurfaceNode] = useState<HTMLElement | null>(null);
  const [arrowNode, setArrowNode] = useState<HTMLElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);
  const [titleNode, setTitleNode] = useState<HTMLElement | null>(null);
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  /** The viewport is in the compact size class: a lateral side turns vertical, the card takes the width. */
  const [narrow, setNarrow] = useState(false);
  const layoutNow = layout ?? defaults.layout;
  const compact = layoutNow === 'compact' || (layoutNow === 'auto' && narrow);
  /** The target leaves a card room on some side; when it does not, the card is centred over it. */
  const [fits, setFits] = useState(true);

  const settings = {
    align: staged?.step.align ?? align ?? defaults.align,
    alignOffset: alignOffset ?? defaults.alignOffset,
    arrow: arrow ?? defaults.arrow,
    arrowPadding: arrowPadding ?? defaults.arrowPadding,
    autoFocus: autoFocus ?? defaults.autoFocus,
    closeOnEscape: closeOnEscape ?? defaults.closeOnEscape,
    closeOnOutsidePress: closeOnOutsidePress ?? defaults.closeOnOutsidePress,
    collisionPadding: collisionPadding ?? defaults.collisionPadding,
    keyboardNavigation: keyboardNavigation ?? defaults.keyboardNavigation,
    missing: missing ?? defaults.missing,
    modal: (modal ?? defaults.modal) && staged?.step.interactive !== true,
    scrollIntoView: scrollIntoView ?? defaults.scrollIntoView,
    side: compactSide(staged?.step.side ?? side ?? defaults.side, compact),
    sideOffset: sideOffset ?? defaults.sideOffset,
    size: size ?? defaults.size,
    spotlight: staged?.step.spotlight ?? spotlight ?? defaults.spotlight,
    targetTimeout: targetTimeout ?? defaults.targetTimeout,
  };

  const latest = useRef({
    currentId,
    isOpen,
    onOpenChange,
    onStepChange,
    open,
    props,
    settings,
    step,
    steps,
  });
  latest.current = {
    currentId,
    isOpen,
    onOpenChange,
    onStepChange,
    open,
    props,
    settings,
    step,
    steps,
  };

  /* ── The two values ───────────────────────────────────────────────────── */

  /** The outcome of the close asked for last, read once the tour has actually closed. */
  const closing = useRef<TourOutcome | undefined>(undefined);

  const requestOpen = useCallback(
    (next: boolean, reason: TourOpenReason, outcome: TourOutcome | undefined, source: unknown) => {
      const state = latest.current;
      if (next === state.isOpen) return;

      let cancelled = false;
      const controllable = createControllable<boolean>({
        controlled: state.open,
        initial: state.isOpen,
        onRequest: (raw) => {
          state.onOpenChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            outcome,
            previous: raw.previous,
            reason,
            source: raw.source,
            value: raw.value,
          });
          cancelled = raw.cancelled;
        },
      });
      const moved = controllable.request(next, reason, source);
      if (cancelled) return;
      if (!next) closing.current = outcome;
      if (moved) setOwnOpen(next);
    },
    [],
  );

  const requestStep = useCallback((id: string, reason: TourNavigationReason, source: unknown) => {
    const state = latest.current;
    if (id === state.currentId) {
      controller.sync(id);
      return;
    }
    let cancelled = false;
    const controllable = createControllable<string | null>({
      controlled: state.step,
      initial: state.currentId,
      onRequest: (raw) => {
        state.onStepChange?.(raw.value, {
          get cancelled() {
            return raw.cancelled;
          },
          cancel: () => raw.cancel(),
          previous: raw.previous,
          reason,
          source: raw.source,
          value: raw.value,
        });
        cancelled = raw.cancelled;
      },
    });
    const moved = controllable.request(id, reason, source);
    if (!cancelled && moved) setOwnStep(id);
  }, []);

  const [controller] = useState(() =>
    createTourController<Step>({
      steps: () => latest.current.steps,
      settings: () => ({
        missing: latest.current.settings.missing,
        targetTimeout: latest.current.settings.targetTimeout,
      }),
      onShow: setShown,
      onPending: (value) => {
        if (value) {
          const card = document.activeElement?.closest('[data-ui="tour"] [data-part="content"]');
          leftFromCard.current = card !== null && card !== undefined;
        }
        setPending(value);
      },
      requestStep: (id, reason, source) => requestStep(id, reason, source),
      requestClose: (outcome, reason, source) => requestOpen(false, reason, outcome, source),
    }),
  );

  useEffect(() => () => controller.destroy(), [controller]);

  useEffect(() => {
    if (isOpen) {
      controller.sync(currentId);
      return;
    }
    controller.reset();
    setPending(false);
  }, [controller, currentId, isOpen]);

  /**
   * A tour closed with Close or Escape resumes where the reader left it; one
   * they finished or skipped starts again from the first step. Decided when
   * the tour has closed, so a controlled `open` that refused the close keeps
   * the reader's place.
   */
  useEffect(() => {
    if (isOpen) return;
    const outcome = closing.current;
    closing.current = undefined;
    if (outcome !== undefined && outcome !== 'close') setOwnStep(null);
  }, [isOpen]);

  /* The steps changed under an open tour: the shown one may have gone. */
  useEffect(() => {
    if (!latest.current.isOpen || shown === null) return;
    if (!steps.some((candidate) => candidate.id === shown.step.id)) controller.sync(null);
  }, [controller, shown, steps]);

  /* ── Choreography ─────────────────────────────────────────────────────── */

  const rootRef = useRef<HTMLElement | null>(null);
  rootRef.current = rootNode;
  const stagedRef = useRef<ResolvedStep<Step> | null>(null);
  stagedRef.current = staged;
  const spotRef = useRef<Element | null>(null);
  spotRef.current = spot.target;
  const staging = useRef<AbortController | null>(null);

  /**
   * Every step the controller shows is staged: the old card leaves while the
   * cutout moves and the page scrolls, and the new card arrives once the
   * cutout has landed (`@slotted/core/tour`'s `stageStep`).
   */
  useEffect(() => {
    if (shown === null) {
      staging.current?.abort();
      staging.current = null;
      if (!latest.current.isOpen) {
        setStaged(null);
        setLeaving(false);
      }
      return;
    }
    staging.current?.abort();
    const run = new AbortController();
    staging.current = run;
    const opening = stagedRef.current === null;
    void stageStep({
      /* Before the tour has an element of its own, the target — or the element
         that opened it — stands in the theme's region and carries the same
         duration tokens. */
      root: rootRef.current ?? shown.target ?? opener.current,
      from: opening ? undefined : spotRef.current,
      to: shown.target,
      scroll: latest.current.settings.scrollIntoView,
      signal: run.signal,
      spot: (target, move) => setSpot({ target, move }),
      card: (phase) => {
        if (phase === 'leave') {
          setLeaving(true);
          return;
        }
        setReady(false);
        /* Whether the arriving card fits beside its target is its own target's
           answer, taken as it arrives; the cutout's may be a different step's. */
        const rect = shown.target?.getBoundingClientRect();
        setFits(
          rect === undefined ||
            cardFits(
              { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
              { width: window.innerWidth, height: window.innerHeight },
            ),
        );
        setStaged(shown);
        setLeaving(false);
      },
    });
    return undefined;
  }, [shown]);

  useEffect(() => () => staging.current?.abort(), []);

  /* ── Presence and portal ──────────────────────────────────────────────── */

  const presence = useRef<PresenceHandle | null>(null);
  /** The element that had focus when the tour opened: where focus returns, and the layer's origin. */
  const opener = useRef<HTMLElement | null>(null);
  const portal = useRef<PortalRootHandle | null>(null);
  const layerHandle = useRef<DismissableLayerHandle | null>(null);
  const [layer, setLayer] = useState<DismissableLayerHandle | null>(null);
  /** Whether focus was in the card when the reader asked to move; a dialog a step opens may take it meanwhile. */
  const leftFromCard = useRef(false);
  useEffect(() => {
    const handle = createPresence({ present: false, onStatusChange: setStatus });
    presence.current = handle;
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);

  const visible = isOpen && staged !== null;
  /**
   * `data-open` is written a frame after the frame exists, so the scrim and
   * the card have a closed style to arrive from: a root born open has nothing
   * to transition from, and the scrim stood at full ink on the first frame.
   */
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    presence.current?.sync(visible);
  }, [visible]);
  useEffect(() => {
    presence.current?.setNode(rootNode);
  }, [rootNode]);
  useEffect(() => {
    if (rootNode === null || !visible) {
      setArrived(false);
      return;
    }
    const frame = requestAnimationFrame(() => setArrived(true));
    return () => cancelAnimationFrame(frame);
  }, [rootNode, visible]);

  /** The last step drawn, kept through the exit so the card leaves as it was. */
  const drawn = useRef<ResolvedStep<Step> | null>(null);
  if (staged !== null) drawn.current = staged;
  const current = staged ?? drawn.current;
  const mounted = current !== null && (visible || status !== 'unmounted');
  /** The tour's words, with the tour's own and the drawn step's laid over the catalog. */
  const stepMessages = current?.step.messages;
  const override = useMemo(
    () => (stepMessages === undefined ? messages : { ...messages, ...stepMessages }),
    [messages, stepMessages],
  );
  const t = useMessages(tourMessages, override);

  useEffect(() => {
    if (!mounted) {
      setContainer(null);
      return;
    }
    /**
     * The layer inherits its theme, scheme, density and direction from its
     * origin, and a centred first step has no target to give it: without one
     * the layer is drawn in no theme at all. The element that had focus when
     * the tour opened is the next best — it is where the reader started — and
     * any target the tour will point at is the one after.
     */
    const origin =
      drawn.current?.target ??
      opener.current ??
      latest.current.steps
        .map((candidate) => resolveTarget(candidate.target, document))
        .find((found) => found !== null) ??
      null;
    const handle = createPortalRoot({ origin });
    portal.current = handle;
    setContainer(handle.container);
    return () => {
      portal.current = null;
      handle.release();
    };
  }, [mounted]);

  /* ── Target, spotlight and card position ──────────────────────────────── */

  /** Where the card points: the staged step's target. The cutout has its own, in `spot`. */
  const target = current?.target ?? null;
  const anchored = target !== null && fits;
  const spotlightOn = settings.spotlight && spot.target !== null;

  useEffect(() => {
    if (!mounted) return;
    const update = () => setNarrow(isCompactViewport(window));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [mounted]);
  const reposition = useRef<() => void>(() => {});

  const spotTarget = spot.target;
  useEffect(() => {
    if (rootNode === null) return;
    if (spotTarget === null) {
      writeTargetRect(rootNode, null);
      return;
    }
    return watchTarget(spotTarget, {
      onRect: (rect) => {
        writeTargetRect(rootNode, rect);
        /* Only the card's own target answers whether the card fits beside it. */
        if (spotTarget === stagedRef.current?.target) {
          setFits(cardFits(rect, { width: window.innerWidth, height: window.innerHeight }));
        }
      },
      onRemoved: () => controller.markMissing(),
    });
  }, [controller, rootNode, spotTarget]);

  const {
    alignOffset: offsetAlong,
    arrowPadding: arrowInset,
    collisionPadding: padding,
  } = settings;
  const sideNow = settings.side;
  const alignNow = settings.align;
  const offsetFrom = settings.sideOffset;
  const stepId = current?.step.id;

  useLayoutEffect(() => {
    if (surfaceNode === null) return;
    if (target === null || !anchored) {
      surfaceNode.style.removeProperty('left');
      surfaceNode.style.removeProperty('top');
      surfaceNode.removeAttribute('data-side');
      surfaceNode.removeAttribute('data-positioned');
      reposition.current = () => {};
      /* A centred card is placed by the stylesheet; it is ready on the next
         frame, so its arrival starts from nothing rather than being skipped. */
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }
    const handle: PositionerHandle = createPositioner(target, surfaceNode, {
      align: alignNow,
      alignOffset: offsetAlong,
      boundaryPadding: padding,
      side: sideNow,
      sideOffset: offsetFrom,
      strategy: 'absolute',
      ...(arrowNode ? { arrow: arrowNode, arrowPadding: arrowInset } : {}),
    });
    reposition.current = () => void handle.update();
    let live = true;
    void handle.update().then(() => {
      if (live) requestAnimationFrame(() => live && setReady(true));
    });
    return () => {
      live = false;
      handle.destroy();
      surfaceNode.removeAttribute('data-positioned');
      reposition.current = () => {};
    };
  }, [
    alignNow,
    anchored,
    arrowInset,
    arrowNode,
    offsetAlong,
    offsetFrom,
    padding,
    sideNow,
    stepId,
    surfaceNode,
    target,
  ]);

  /* ── The layer ────────────────────────────────────────────────────────── */

  const modalNow = settings.modal;
  const escapeNow = settings.closeOnEscape;
  const outsideNow = settings.closeOnOutsidePress;
  /* The target of an interactive step is part of the layer: pressing it is not a press outside. */
  const branch = current?.step.interactive === true ? target : null;

  useEffect(() => {
    if (rootNode === null || surfaceNode === null || !visible) return;
    const layer = createDismissableLayer(rootNode, {
      back: modalNow,
      content: surfaceNode,
      escape: escapeNow,
      modal: modalNow,
      outsidePress: outsideNow,
      scrollLock: false,
      onDismiss: (request) => {
        requestOpen(false, DISMISS_REASONS[request.reason], 'close', request.source);
      },
    });
    layerHandle.current = layer;
    setLayer(layer);
    return () => {
      layerHandle.current = null;
      setLayer(null);
      layer.destroy();
    };
  }, [escapeNow, modalNow, outsideNow, requestOpen, rootNode, surfaceNode, visible]);

  /**
   * The layer is made again only when something that defines it changes. A
   * modal layer holds a history entry for the way back, and one made again for
   * a new branch gave its entry back and took a new one: the browser's
   * `popstate` for the entry given back arrived as the way back, and closed
   * the tour. The target of an interactive step joins as a branch instead.
   */
  useEffect(() => {
    if (layer === null || branch === null) return;
    return layer.addBranch(branch);
  }, [branch, layer]);

  /**
   * A step whose target lives in a layer opened after the tour — a dialog its
   * `prepare` opened — would stand under that layer, inert and unreachable.
   * The tour is raised back over it, in the document and in the stack.
   */
  useLayoutEffect(() => {
    const layerNode = rootNode?.parentElement ?? null;
    if (!visible || spotTarget === null || layerNode === null) return;
    return keepOverTarget(layerNode, spotTarget, () => {
      portal.current?.raise();
      layerHandle.current?.raise();
    });
  }, [rootNode, spotTarget, visible]);

  useEffect(() => {
    if (rootNode === null || !visible || !modalNow) return;
    const scope = createFocusScope(rootNode, { contain: true, initial: false, restore: false });
    return () => scope.destroy();
  }, [modalNow, rootNode, visible]);

  /* ── Focus ────────────────────────────────────────────────────────────── */

  const focusedStep = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (opener.current === null) {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
  }, [isOpen]);

  useEffect(() => {
    /* A frame still hidden until the frame it arrives in cannot take focus:
       the browser refuses to focus what is not rendered. */
    if (!visible || !arrived || contentNode === null || staged === null) return;
    const id = staged.step.id;
    if (focusedStep.current === id) return;
    const first = focusedStep.current === null;
    focusedStep.current = id;

    const active = document.activeElement;
    const inCard =
      active === null || active === document.body || (rootNode?.contains(active) ?? false);

    /* The mark is the navigation's that led here; the opening has none, and
       a first card focused late must not take the mark of the next move. */
    const fromCard = !first && leftFromCard.current;
    if (!first) leftFromCard.current = false;
    if (first ? latest.current.settings.autoFocus : inCard || fromCard) {
      contentNode.focus({ preventScroll: true });
      return;
    }
    if (!first) {
      const text = staged.step.announcement ?? titleNode?.textContent ?? '';
      if (text !== '') getLiveAnnouncer(document).announce(text);
    }
  }, [arrived, contentNode, rootNode, staged, titleNode, visible]);

  useEffect(() => {
    if (isOpen) return;
    const wasOpen = focusedStep.current !== null;
    focusedStep.current = null;
    const origin = opener.current;
    opener.current = null;
    if (!wasOpen) return;
    const active = document.activeElement;
    const inside =
      active === null || active === document.body || (rootNode?.contains(active) ?? false);
    if (!inside) return;
    const destination = resolveFocus(latest.current.props.finalFocus, document) ?? origin;
    if (destination?.isConnected) destination.focus();
  }, [isOpen, rootNode]);

  /* ── advanceOn ────────────────────────────────────────────────────────── */

  const advanceOn = current?.step.advanceOn;
  useEffect(() => {
    if (!visible || target === null || advanceOn === undefined) return;
    const listener = (event: Event) => controller.next(eventReason(event), event);
    target.addEventListener(advanceOn, listener);
    return () => target.removeEventListener(advanceOn, listener);
  }, [advanceOn, controller, target, visible]);

  /* ── Handle ───────────────────────────────────────────────────────────── */

  useImperativeHandle(
    ref,
    () => ({
      close: (outcome = 'close') => requestOpen(false, 'programmatic', outcome, undefined),
      goTo: (id) => controller.goTo(id, 'programmatic'),
      next: () => controller.next('programmatic'),
      prev: () => controller.prev('programmatic'),
      reposition: () => reposition.current(),
      start: (id) => {
        if (id !== undefined) requestStep(id, 'programmatic', undefined);
        requestOpen(true, 'programmatic', undefined, undefined);
      },
    }),
    [controller, requestOpen, requestStep],
  );

  /* ── Rendering ────────────────────────────────────────────────────────── */

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!latest.current.settings.keyboardNavigation) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const origin = event.target instanceof Element ? event.target : null;
      if (isTextEntry(origin)) return;
      const action = tourKey(event.key, origin === null ? 'ltr' : directionOf(origin));
      if (action === null) return;
      event.preventDefault();
      if (action === 'next') controller.next('keyboard', event);
      else controller.prev('keyboard', event);
    },
    [controller],
  );

  /* Nothing is drawn before the portal exists: a frame drawn in place and
     moved a frame later is a card remounted, and the focus it was given is
     lost with the first one. */
  if (!mounted || current === null || container === null) return null;

  const progress = tourProgress(steps, current.step.id);
  const context: TourContextValue = {
    close: (outcome, source) => {
      const dismiss = typeof source === 'object' && source !== null && 'dismiss' in source;
      requestOpen(false, dismiss ? 'dismiss' : pressFrom(source), outcome, source);
    },
    descriptionId: `${base}description`,
    first: progress.first,
    goTo: (id) => controller.goTo(id, 'programmatic'),
    hasDescription,
    hasTitle,
    last: progress.last,
    missing: current.missing,
    modal: settings.modal,
    next: (source) => controller.next(pressFrom(source), source),
    onKeyDown,
    pending,
    position: progress.position,
    press: (event) => pressReason(event),
    prev: (source) => controller.prev(pressFrom(source), source),
    setContentNode,
    setHasDescription,
    setHasTitle,
    setTitleNode,
    step: current.step,
    t,
    target: current.target,
    titleId: `${base}title`,
    total: progress.total,
  };

  const onGuardFocus = () => {
    /* The target of a non-modal step is what the reader is asked to operate,
       so Tab past either edge of the card goes to it. */
    let destination: HTMLElement | null = null;
    if (target instanceof HTMLElement) {
      destination = tabbables(target)[0] ?? (target.tabIndex >= 0 ? target : null);
    }
    (destination ?? contentNode)?.focus();
  };
  const guard = !settings.modal && (
    <span
      aria-hidden="true"
      data-part="focus-guard"
      data-part-focus-guard=""
      onFocus={onGuardFocus}
      tabIndex={0}
    />
  );

  const frame = (
    <div
      data-align={anchored ? settings.align : undefined}
      data-compact={compact ? '' : undefined}
      data-missing={current.missing ? '' : undefined}
      data-modal={settings.modal ? '' : undefined}
      data-open={visible && arrived ? '' : undefined}
      data-part="root"
      data-part-root=""
      data-placement={anchored ? 'anchored' : 'centered'}
      data-size={settings.size}
      data-spot={spot.move}
      data-spotlight={spotlightOn ? '' : undefined}
      data-ui="tour"
      data-ui-tour=""
      ref={setRootNode}
    >
      {(settings.modal || spotlightOn) && (
        <div aria-hidden="true" data-part="backdrop" data-part-backdrop="">
          {spotlightOn && <div data-part="spotlight" data-part-spotlight="" />}
        </div>
      )}
      <div
        data-leaving={leaving ? '' : undefined}
        data-part="surface"
        data-part-surface=""
        data-placement={anchored ? 'anchored' : 'centered'}
        data-ready={ready ? '' : undefined}
        ref={setSurfaceNode}
      >
        {guard}
        {anchored && settings.arrow && (
          <div data-part="arrow" data-part-arrow="" ref={setArrowNode} />
        )}
        {children ?? <TourAnatomy />}
        {guard}
      </div>
    </div>
  );

  return (
    <TourContext.Provider value={context}>{createPortal(frame, container)}</TourContext.Provider>
  );
}

/** The reason a part's press carries, from the event it hands over. */
function pressFrom(source: unknown): TourNavigationReason {
  if (source instanceof Event) return eventReason(source);
  if (typeof source === 'object' && source !== null && 'detail' in source) {
    return pressReason(source as { detail: number });
  }
  return 'programmatic';
}

/** The whole card, as the family draws it when the consumer composes nothing. */
function TourAnatomy() {
  return (
    <TourContent>
      <TourMedia />
      <TourHeader>
        <TourProgress />
        <TourClose />
      </TourHeader>
      <TourTitle />
      <TourDescription />
      <TourBody />
      <TourFooter>
        <TourSkip />
        <TourPrev />
        <TourNext />
      </TourFooter>
    </TourContent>
  );
}
