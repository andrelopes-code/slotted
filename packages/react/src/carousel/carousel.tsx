import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/carousel/carousel.css';

import {
  canStep,
  createCarouselEngine,
  createCarouselRotation,
  EMPTY_PAGES,
  stepPage,
} from '@slotted/core/carousel';
import type {
  CarouselEngineHandle,
  CarouselPages,
  CarouselRotationHandle,
} from '@slotted/core/carousel';
import { carouselMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, FocusEvent, PointerEvent } from 'react';

import { useLocale, useMessages } from '../i18n';
import { useCarouselDefaults } from './carousel-defaults';
import type {
  CarouselContextValue,
  CarouselPageReason,
  CarouselPlayingReason,
  CarouselProps,
  CarouselRootProps,
} from './carousel.types';

const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

const CarouselContext = createContext<CarouselContextValue | undefined>(undefined);

/**
 * What the carousel around a part says. A part outside one has no page to
 * show and no viewport to move, so this throws rather than rendering a
 * control that looks right and does nothing.
 */
export function useCarousel(): CarouselContextValue {
  const context = useContext(CarouselContext);
  if (context === undefined) {
    throw new Error('Carousel parts must be rendered inside Carousel.');
  }
  return context;
}

/** Whether focus arrived the way a keyboard brings it; an engine without the selector says yes. */
function focusVisible(target: EventTarget): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** Whether the reader's own hand moved the page, which stops the rotation. */
function byReader(reason: CarouselPageReason): reason is 'pointer' | 'keyboard' | 'scroll' {
  return reason === 'pointer' || reason === 'keyboard' || reason === 'scroll';
}

/** The reasons a page change is said aloud: the reader asked for it and did not watch it happen elsewhere. */
const ANNOUNCED_REASONS: ReadonlySet<CarouselPageReason> = new Set([
  'pointer',
  'keyboard',
  'scroll',
]);

/**
 * A set of slides shown a page at a time, and the controls that move it.
 *
 * **The viewport is a native scroller with snap**, so a finger, a trackpad
 * and the keyboard page it as the platform does, and the server's response is
 * already a working carousel. `@slotted/core/carousel` reads the pages from
 * the slides' own boxes, animates the scroll on the theme's motion scale,
 * drags it with a mouse, and reports where a gesture ended; the page a
 * consumer owns is decided here, as a request with a reason.
 *
 * **The rotation follows the APG.** It never starts unless asked, it does not
 * start for a reader who asked for reduced motion, hover and a hidden
 * document hold it with the time that was left, and keyboard focus entering
 * the carousel stops it until the rotation control starts it again.
 */
export function Carousel({
  align,
  arrows,
  autoplay,
  children,
  defaultPage,
  defaultPlaying,
  draggable,
  handleRef,
  loop,
  messages,
  onFocus,
  onPageChange,
  onPlayingChange,
  onPointerEnter,
  onPointerLeave,
  orientation,
  page,
  playing,
  ref,
  render,
  size,
  slidesPerMove,
  slidesPerView,
  style,
  transition,
  ...nativeProps
}: CarouselProps) {
  const defaults = useCarouselDefaults();
  const baseId = useId();

  const resolvedAlign = align ?? defaults.align;
  const resolvedArrows = arrows ?? defaults.arrows;
  const resolvedDraggable = draggable ?? defaults.draggable;
  const resolvedLoop = loop ?? defaults.loop;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedSize = size ?? defaults.size;
  const resolvedTransition = transition ?? defaults.transition;
  const t = useMessages(carouselMessages, messages);
  const locale = useLocale();
  const resolvedSlidesPerMove = slidesPerMove ?? 'page';
  const rotates = autoplay !== undefined && autoplay !== false;
  const delay = typeof autoplay === 'number' ? autoplay : defaults.autoplayDelay;

  const [ownPage, setOwnPage] = useState(defaultPage ?? 0);
  const committed = page ?? ownPage;
  const [visualPage, setVisualPage] = useState<number | null>(null);

  const [ownPlaying, setOwnPlaying] = useState(rotates && defaultPlaying !== false);
  const isPlaying = rotates && (playing ?? ownPlaying);

  const [pages, setPages] = useState<CarouselPages>(EMPTY_PAGES);
  const [slideIds, setSlideIds] = useState<string[]>([]);
  const [measured, setMeasured] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [held, setHeld] = useState(false);
  /** Bumped by every request, so the viewport is brought back to the page the consumer kept. */
  const [revision, setRevision] = useState(0);

  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const engine = useRef<CarouselEngineHandle | null>(null);
  const rotation = useRef<CarouselRotationHandle | null>(null);
  const motion = useRef<{ animate: boolean; announce: boolean }>({
    animate: false,
    announce: false,
  });
  const delayRef = useRef(delay);
  delayRef.current = delay;
  /** The page the viewport was last brought to, so a refused request is brought back and not announced. */
  const placed = useRef<number | null>(null);

  const pageCount = pages.positions.length;
  const current = pageCount === 0 ? committed : Math.min(Math.max(committed, 0), pageCount - 1);
  const shown = visualPage ?? current;

  function setPlayingState(next: boolean, reason: CarouselPlayingReason, source: unknown) {
    if (!rotates || next === isPlaying) return;
    const state = createControllable<boolean>({
      controlled: playing,
      initial: isPlaying,
      onRequest: (request) => onPlayingChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setOwnPlaying(next);
  }

  function go(
    next: number,
    reason: CarouselPageReason,
    source: unknown,
    options: { instant?: boolean } = {},
  ) {
    if (pageCount === 0 || next < 0 || next >= pageCount) return;
    if (byReader(reason) && isPlaying) setPlayingState(false, reason, source);
    setVisualPage(null);
    setRevision((value) => value + 1);
    if (next === current) return;

    motion.current = {
      animate: options.instant !== true,
      announce: ANNOUNCED_REASONS.has(reason),
    };
    const state = createControllable<number>({
      controlled: page,
      initial: current,
      onRequest: (request) => onPageChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setOwnPage(next);
  }

  function step(delta: 1 | -1, reason: CarouselPageReason, source: unknown) {
    if (!canStep(current, delta, pageCount, resolvedLoop)) return;
    go(stepPage(current, delta, pageCount, resolvedLoop), reason, source);
  }

  /** The latest of everything the engine and the rotation call back into. */
  const latest = useRef({ current, go, setPlayingState, pageCount, loop: resolvedLoop, isPlaying });
  useEffect(() => {
    latest.current = { current, go, setPlayingState, pageCount, loop: resolvedLoop, isPlaying };
  });
  const options = useRef({
    orientation: resolvedOrientation,
    align: resolvedAlign,
    slidesPerMove: resolvedSlidesPerMove,
    transition: resolvedTransition,
    draggable: resolvedDraggable,
    t,
  });
  options.current = {
    orientation: resolvedOrientation,
    align: resolvedAlign,
    slidesPerMove: resolvedSlidesPerMove,
    transition: resolvedTransition,
    draggable: resolvedDraggable,
    t,
  };

  useIsomorphicLayoutEffect(() => {
    if (viewport === null) return undefined;
    const handle = createCarouselEngine(viewport, {
      orientation: () => options.current.orientation,
      align: () => options.current.align,
      slidesPerMove: () => options.current.slidesPerMove,
      transition: () => options.current.transition,
      draggable: () => options.current.draggable,
      page: () => latest.current.current,
      idPrefix: `${baseId}slide-`,
      slideLabel: (index, count) => options.current.t('slide', { index: index + 1, count }),
      onPages: (next, ids) => {
        setPages(next);
        setSlideIds(ids);
        setMeasured(true);
      },
      onVisualPage: setVisualPage,
      onSettle: (next, reason, event) => latest.current.go(next, reason, event, { instant: true }),
      onDraggingChange: setDragging,
      onSwipe: (delta, event) => {
        const { current: at, pageCount: count, loop: wraps } = latest.current;
        if (!canStep(at, delta, count, wraps)) return;
        latest.current.go(stepPage(at, delta, count, wraps), 'pointer', event);
      },
      onPeekPress: (slide, event) => {
        const target = handle.pages().pageOfSlide[slide];
        if (target !== undefined) latest.current.go(target, 'pointer', event);
      },
    });
    engine.current = handle;
    handle.setCurrent(latest.current.current);
    handle.scrollToPage(latest.current.current, { animate: false });
    return () => {
      handle.destroy();
      engine.current = null;
    };
  }, [
    viewport,
    resolvedOrientation,
    resolvedTransition,
    resolvedAlign,
    resolvedSlidesPerMove,
    baseId,
  ]);

  /** The viewport follows the page the family holds, whoever moved it. */
  useIsomorphicLayoutEffect(() => {
    const handle = engine.current;
    if (handle === null) return;
    const moved = placed.current !== current;
    placed.current = current;
    handle.setCurrent(current);
    /* An unmoved page is a request the consumer refused: the viewport glides back to it. */
    handle.scrollToPage(current, { animate: moved ? motion.current.animate : true });
    if (moved && motion.current.announce && pageCount > 0) {
      getLiveAnnouncer(viewport?.ownerDocument).announce(
        t('announce', { page: current + 1, count: pageCount }),
      );
    }
    motion.current = { animate: false, announce: false };
    rotation.current?.restart();
  }, [current, revision, pages]);

  /** A page that stopped existing — the slides changed, the container shrank — is asked away with `resize`. */
  useEffect(() => {
    if (pageCount > 0 && committed > pageCount - 1)
      go(pageCount - 1, 'resize', undefined, { instant: true });
  }, [pageCount]);

  /** Reduced motion is the reader's word, read once the page can be asked. */
  useEffect(() => {
    if (!rotates || playing !== undefined || defaultPlaying === true) return;
    const query = viewport?.ownerDocument.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    );
    if (query?.matches === true) setOwnPlaying(false);
  }, [viewport]);

  useEffect(() => {
    if (!rotates || viewport === null) return undefined;
    const handle = createCarouselRotation({
      delay: () => delayRef.current,
      document: viewport.ownerDocument,
      onHeldChange: setHeld,
      onTick: () => {
        const { current: at, pageCount: count, loop: wraps } = latest.current;
        if (count <= 1) return;
        if (at >= count - 1 && !wraps) {
          latest.current.setPlayingState(false, 'timeout', undefined);
          return;
        }
        latest.current.go(stepPage(at, 1, count, true), 'timeout', undefined);
      },
    });
    rotation.current = handle;
    setHeld(handle.held());
    return () => {
      handle.destroy();
      rotation.current = null;
    };
  }, [rotates, viewport]);

  useEffect(() => {
    if (isPlaying && pageCount > 1) rotation.current?.start();
    else rotation.current?.stop();
  }, [isPlaying, pageCount]);

  useImperativeHandle(
    handleRef,
    () => ({
      scrollTo: (target: number) => latest.current.go(target, 'programmatic', undefined),
      scrollToSlide: (slide: number) => {
        const target = engine.current?.pages().pageOfSlide[slide];
        if (target !== undefined) latest.current.go(target, 'programmatic', undefined);
      },
      refresh: () => {
        engine.current?.measure();
      },
    }),
    [],
  );

  function handleFocus(event: FocusEvent<HTMLElement>) {
    onFocus?.(event);
    if (!isPlaying) return;
    /* "Automatic slide rotation stops when any element in the carousel receives keyboard focus." */
    if (focusVisible(event.target)) setPlayingState(false, 'keyboard', event);
  }

  function handlePointerEnter(event: PointerEvent<HTMLElement>) {
    onPointerEnter?.(event);
    if (event.pointerType === 'mouse') rotation.current?.hold('hover');
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>) {
    onPointerLeave?.(event);
    rotation.current?.release('hover');
  }

  const context: CarouselContextValue = {
    attachViewport: setViewport,
    viewportId: `${baseId}viewport`,
    orientation: resolvedOrientation,
    transition: resolvedTransition,
    size: resolvedSize,
    loop: resolvedLoop,
    t,
    locale,
    page: shown,
    pageCount,
    pages,
    slideIds,
    playing: isPlaying,
    autoplay: rotates,
    canPrevious: canStep(current, -1, pageCount, resolvedLoop),
    canNext: canStep(current, 1, pageCount, resolvedLoop),
    go,
    step,
    setPlaying: setPlayingState,
  };

  const runtime: Record<string, string> = {};
  if (slidesPerView !== undefined)
    runtime['--slotted-carousel-slides-per-view'] = String(slidesPerView);
  if (rotates) runtime['--slotted-carousel-autoplay-delay'] = `${delay}ms`;

  const rootProps: CarouselRootProps = keyedProps({
    ...nativeProps,
    'aria-roledescription': t('roleDescription'),
    children,
    'data-align': resolvedAlign,
    'data-arrows': resolvedArrows,
    ...(resolvedDraggable ? { 'data-draggable': '' } : {}),
    ...(dragging ? { 'data-dragging': '' } : {}),
    ...(measured ? { 'data-measured': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    ...(isPlaying ? { 'data-playing': '' } : {}),
    ...(isPlaying && held ? { 'data-paused': '' } : {}),
    'data-size': resolvedSize,
    'data-transition': resolvedTransition,
    'data-ui': 'carousel',
    onFocus: handleFocus,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    style: { ...runtime, ...style } as CSSProperties,
  });

  return (
    <CarouselContext.Provider value={context}>
      {render === undefined ? <section {...rootProps} ref={ref} /> : render(rootProps)}
    </CarouselContext.Provider>
  );
}
