/**
 * The behaviour of a carousel, with no framework in it.
 *
 * A carousel is a scroller with snap, and the platform already pages it under
 * a finger, a trackpad and the keyboard. What the platform does not give is
 * the arithmetic around it — which positions are pages when several slides
 * share a view, which page the reader is on, which slides are in view — and
 * the three movements a scroller cannot make on its own: a scroll that runs on
 * the theme's motion scale, a drag with a mouse, and a swipe between stacked
 * slides. Those are here, once, for both bindings.
 *
 * The hot path stays out of the frameworks. The engine writes the attributes
 * that change on every scroll or resize on the elements themselves —
 * `data-snap`, `data-inview`, `inert`, `data-current` and the default name on
 * each slide, `data-moving` and `--slotted-carousel-overscroll` on the viewport — and reports pages, the page
 * under the reader and the end of a gesture through callbacks. The page a
 * consumer owns is the binding's.
 *
 * Every offset is logical: measured from the inline start (or the block start
 * of a vertical carousel), so a right-to-left document, whose `scrollLeft`
 * runs negative in every current engine, is the same arithmetic.
 */

export type CarouselOrientation = 'horizontal' | 'vertical';
export type CarouselAlign = 'start' | 'center';
export type CarouselTransition = 'slide' | 'fade';
/** A number of slides, or `page` for the slides wholly in view. */
export type CarouselSlidesPerMove = number | 'page';
export type CarouselIntent = 'previous' | 'next' | 'first' | 'last';
/** How far an indicator stands from the current one, once the row is adaptive. */
export type CarouselIndicatorDistance = '0' | '1' | '2' | 'far';

/** Every slide's box along the axis, and the viewport's, in logical pixels. */
export interface CarouselMetrics {
  /** The viewport's client size along the axis. */
  viewport: number;
  /** The viewport's padding at the start and end of the axis, which is also its scroll padding. */
  paddingStart: number;
  paddingEnd: number;
  /** How far the viewport can scroll. */
  maxScroll: number;
  /** Each slide's start (from the scroll origin, padding included) and size. */
  slides: readonly { start: number; size: number }[];
}

export interface CarouselPages {
  /** The scroll offset of each page, ascending, never past `maxScroll`. */
  positions: number[];
  /** The first slide of each page. */
  starts: number[];
  /** The page each slide belongs to. */
  pageOfSlide: number[];
}

export const EMPTY_PAGES: CarouselPages = { positions: [], starts: [], pageOfSlide: [] };

/** A slide the engine and both stylesheets recognise. */
export const SLIDE_SELECTOR = '[data-part="slide"]';

/** The rotation's own wait, when the consumer turns it on with `true`. */
export const DEFAULT_AUTOPLAY_DELAY = 5000;

/** Past this many pages, a row of dots becomes adaptive. */
export const ADAPTIVE_FROM = 8;

/** Pixels a mouse moves along the axis before a press becomes a drag. */
export const DRAG_THRESHOLD = 4;

/** Pixels a millisecond a released drag must still move to count as a flick to the next page. */
export const FLICK_SPEED = 0.25;

/** Pixels a finger moves along the axis before a swipe between stacked slides counts. */
export const SWIPE_THRESHOLD = 40;

/** A slide is in view when this share of it or more is inside the viewport. */
export const IN_VIEW_THRESHOLD = 0.5;

/** Half a pixel: a position this close to another is the same position. */
const EPSILON = 0.5;

/**
 * The pages of a track, from the slides' own boxes.
 *
 * `start` alignment: a page starts where a slide starts, less the scroll
 * padding, and no page is past the end of the track — the last page is the
 * end, whatever slide sits there. With `page`, the next page starts at the
 * first slide the current page does not show whole, which is how a row of
 * three cards pages by three and a row whose last page holds two still ends
 * flush. With a number, the next page starts that many slides on.
 *
 * `center` alignment: every slide is a page, centred in the viewport; the
 * slides near the ends, whose centre the track cannot reach, share the page
 * at that end.
 */
export function carouselPages(
  metrics: CarouselMetrics,
  options: { align?: CarouselAlign; slidesPerMove?: CarouselSlidesPerMove } = {},
): CarouselPages {
  const { slides, viewport, paddingStart, paddingEnd, maxScroll } = metrics;
  if (slides.length === 0) return { positions: [], starts: [], pageOfSlide: [] };

  const clamp = (value: number) => Math.min(Math.max(value, 0), Math.max(maxScroll, 0));
  const positions: number[] = [];
  const starts: number[] = [];
  const pageOfSlide: number[] = Array.from({ length: slides.length }, () => 0);

  function push(slide: number, position: number): boolean {
    const last = positions.at(-1);
    if (last !== undefined && position <= last + EPSILON) return false;
    positions.push(position);
    starts.push(slide);
    return true;
  }

  if (options.align === 'center') {
    for (const [index, slide] of slides.entries()) {
      push(index, clamp(slide.start + slide.size / 2 - viewport / 2));
      pageOfSlide[index] = positions.length - 1;
    }
    return { positions, starts, pageOfSlide };
  }

  const move = options.slidesPerMove ?? 'page';
  const positionOf = (index: number) => clamp((slides[index]?.start ?? 0) - paddingStart);

  let index = 0;
  while (index < slides.length) {
    const position = positionOf(index);
    push(index, position);
    if (position >= maxScroll - EPSILON) break;

    let next: number;
    if (move === 'page') {
      const visibleEnd = position + viewport - paddingEnd;
      next = index + 1;
      while (next < slides.length) {
        const slide = slides[next];
        if (slide === undefined || slide.start + slide.size > visibleEnd + EPSILON) break;
        next += 1;
      }
      if (next >= slides.length) break;
    } else {
      next = index + Math.max(1, Math.floor(move));
      if (next >= slides.length) {
        /* The end of the track is a page even when the step skips past it. */
        push(slides.length - 1, clamp(maxScroll));
        break;
      }
    }
    index = next;
  }

  for (let slide = 0, page = 0; slide < slides.length; slide += 1) {
    while (page + 1 < starts.length && (starts[page + 1] ?? Infinity) <= slide) page += 1;
    pageOfSlide[slide] = page;
  }
  return { positions, starts, pageOfSlide };
}

/** The page whose position is nearest an offset; `-1` with no pages. */
export function nearestPage(positions: readonly number[], offset: number): number {
  let best = -1;
  let distance = Infinity;
  for (const [index, position] of positions.entries()) {
    const gap = Math.abs(position - offset);
    if (gap < distance - EPSILON) {
      best = index;
      distance = gap;
    }
  }
  return best;
}

/**
 * The page a step lands on. Without a loop a step past an end stays at the
 * end; with one it wraps. `-1` when there are no pages.
 */
export function stepPage(page: number, delta: number, count: number, loop: boolean): number {
  if (count <= 0) return -1;
  const target = page + delta;
  if (loop) return ((target % count) + count) % count;
  return Math.min(Math.max(target, 0), count - 1);
}

/** Whether a step from this page has anywhere to go. */
export function canStep(page: number, delta: number, count: number, loop: boolean): boolean {
  if (count <= 1) return false;
  if (loop) return true;
  const target = page + delta;
  return target >= 0 && target < count;
}

/**
 * What a key asks the viewport for. The arrows of the axis move a page and
 * mirror in a right-to-left document; the cross axis is the page's own, so
 * the document keeps scrolling with focus on a horizontal carousel.
 */
export function carouselKeyIntent(
  key: string,
  orientation: CarouselOrientation,
  direction: 'ltr' | 'rtl',
): CarouselIntent | null {
  switch (key) {
    case 'PageDown':
      return 'next';
    case 'PageUp':
      return 'previous';
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    default:
      break;
  }
  if (orientation === 'vertical') {
    if (key === 'ArrowDown') return 'next';
    if (key === 'ArrowUp') return 'previous';
    return null;
  }
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (key === forward) return 'next';
  if (key === backward) return 'previous';
  return null;
}

/** The page an intent lands on, or `-1` when it lands nowhere. */
export function intentPage(
  intent: CarouselIntent,
  page: number,
  count: number,
  loop: boolean,
): number {
  if (count <= 0) return -1;
  if (intent === 'first') return 0;
  if (intent === 'last') return count - 1;
  return stepPage(page, intent === 'next' ? 1 : -1, count, loop);
}

/** Which slides have at least `threshold` of their size inside the viewport at an offset. */
export function slidesInView(
  metrics: CarouselMetrics,
  offset: number,
  threshold = IN_VIEW_THRESHOLD,
): boolean[] {
  const from = offset;
  const to = offset + metrics.viewport;
  return metrics.slides.map((slide) => {
    if (slide.size <= 0) return false;
    const visible = Math.min(slide.start + slide.size, to) - Math.max(slide.start, from);
    return visible / slide.size >= threshold - 1e-6;
  });
}

/**
 * How far an indicator is from the current one, for the adaptive row; `null`
 * when the row is short enough to show every dot whole.
 */
export function indicatorDistance(
  index: number,
  current: number,
  count: number,
  adaptiveFrom = ADAPTIVE_FROM,
): CarouselIndicatorDistance | null {
  if (count < adaptiveFrom) return null;
  /* The window keeps five dots whole at the ends, where the current one has no neighbour on one side. */
  const centre = Math.min(Math.max(current, 2), count - 3);
  const distance = Math.abs(index - centre);
  if (index === current || distance === 0) return '0';
  if (distance === 1) return '1';
  if (distance === 2) return '2';
  return 'far';
}

/** A CSS time — `320ms`, `0.32s` — in milliseconds; 0 for anything else. */
export function parseCssTime(value: string): number {
  const match = /^\s*(-?[\d.]+)(ms|s)\s*$/.exec(value);
  if (match === null) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  return match[2] === 's' ? amount * 1000 : amount;
}

/**
 * Scrolls a strip of indicators — a row of thumbnails — just enough to show
 * one of them whole, and never the page around it: `scrollIntoView` moves
 * every scroller up to the document, and a rotation ticking on a strip half
 * below the fold would drag the page down with it on every page.
 */
export function revealInStrip(strip: HTMLElement, item: HTMLElement, margin = 8): void {
  const outer = strip.getBoundingClientRect();
  const inner = item.getBoundingClientRect();
  if (strip.scrollWidth > strip.clientWidth) {
    if (inner.left < outer.left + margin) strip.scrollLeft -= outer.left + margin - inner.left;
    else if (inner.right > outer.right - margin)
      strip.scrollLeft += inner.right - (outer.right - margin);
  }
  if (strip.scrollHeight > strip.clientHeight) {
    if (inner.top < outer.top + margin) strip.scrollTop -= outer.top + margin - inner.top;
    else if (inner.bottom > outer.bottom - margin)
      strip.scrollTop += inner.bottom - (outer.bottom - margin);
  }
}

/**
 * How stiff the spring the scroll runs on is, against the theme's long
 * duration: the stiffness is this many over the duration, so at the duration
 * 0.3 per cent of the distance is left. Seven left twelve pixels of a page to
 * crawl through for a further 150 ms, which read as a stall.
 */
export const SPRING_STIFFNESS = 8;

/** Where a critically damped spring stands, and how fast it moves, `t` milliseconds in. */
export function springAt(
  from: number,
  target: number,
  velocity: number,
  omega: number,
  t: number,
): { position: number; velocity: number } {
  const displacement = from - target;
  const b = velocity + omega * displacement;
  const decay = Math.exp(-omega * t);
  return {
    position: target + (displacement + b * t) * decay,
    velocity: (b - omega * (displacement + b * t)) * decay,
  };
}

/**
 * The speed a spring may start with toward its target without passing it.
 * A faster flick is held to it: the scroller cannot draw past its ends, and in
 * the middle a page that overshoots and returns reads as a bounce.
 */
export function springLaunch(
  from: number,
  target: number,
  velocity: number,
  omega: number,
): number {
  const distance = target - from;
  if (distance === 0 || Math.sign(velocity) !== Math.sign(distance)) return velocity;
  const limit = omega * Math.abs(distance);
  return Math.sign(velocity) * Math.min(Math.abs(velocity), limit);
}

/**
 * How far content follows a pointer that has pulled it past an end: the pull
 * less and less as it lengthens, never more than the viewport. The curve is
 * the one the platform scroll views draw, with their constant.
 */
export function rubberBand(distance: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0) return 0;
  return (
    (1 - 1 / ((Math.abs(distance) * constant) / dimension + 1)) * dimension * Math.sign(distance)
  );
}

/* ── The rotation ─────────────────────────────────────────────────────── */

/** Why the rotation is held for a moment, without the reader having stopped it. */
export type CarouselHold = 'hover' | 'hidden';

export interface CarouselRotationOptions {
  /** Read at each start, so a delay changed while running applies to the next page. */
  delay: () => number;
  onTick: () => void;
  /** Whether anything is holding the rotation, for `data-paused`. */
  onHeldChange?: ((held: boolean) => void) | undefined;
  /** Listens for a hidden document when given. */
  document?: Document | undefined;
}

export interface CarouselRotationHandle {
  /** Runs the clock, or keeps it running; a stopped clock starts a full delay. */
  start: () => void;
  stop: () => void;
  hold: (reason: CarouselHold) => void;
  release: (reason: CarouselHold) => void;
  /** A full delay from now, for a page that changed by another hand. */
  restart: () => void;
  running: () => boolean;
  held: () => boolean;
  destroy: () => void;
}

/**
 * The clock of a rotation. It runs while it is started and nothing holds it,
 * and a hold keeps the time that was left: a reader who hovers for a second
 * on a page two seconds from turning still has two seconds when they leave.
 * The fill of the current indicator pauses with the same hold, so the picture
 * and the clock never disagree.
 */
export function createCarouselRotation(options: CarouselRotationOptions): CarouselRotationHandle {
  let started = false;
  const holds = new Set<CarouselHold>();
  let remaining = Math.max(0, options.delay());
  let since = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

  function clear() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clear();
    if (!started || holds.size > 0) return;
    since = now();
    timer = setTimeout(() => {
      timer = null;
      remaining = Math.max(0, options.delay());
      options.onTick();
      schedule();
    }, remaining);
  }

  function consume() {
    if (timer === null) return;
    remaining = Math.max(0, remaining - (now() - since));
    clear();
  }

  const doc = options.document;
  const onVisibility = () => {
    if (doc?.visibilityState === 'hidden') handle.hold('hidden');
    else handle.release('hidden');
  };
  doc?.addEventListener('visibilitychange', onVisibility);

  const handle: CarouselRotationHandle = {
    start() {
      if (started) return;
      started = true;
      remaining = Math.max(0, options.delay());
      schedule();
    },
    stop() {
      started = false;
      clear();
      remaining = Math.max(0, options.delay());
    },
    hold(reason) {
      if (holds.has(reason)) return;
      const was = holds.size > 0;
      consume();
      holds.add(reason);
      if (!was) options.onHeldChange?.(true);
    },
    release(reason) {
      if (!holds.delete(reason)) return;
      if (holds.size === 0) {
        options.onHeldChange?.(false);
        schedule();
      }
    },
    restart() {
      remaining = Math.max(0, options.delay());
      schedule();
    },
    running: () => started && holds.size === 0,
    held: () => holds.size > 0,
    destroy() {
      clear();
      doc?.removeEventListener('visibilitychange', onVisibility);
    },
  };
  if (doc?.visibilityState === 'hidden') holds.add('hidden');
  return handle;
}

/* ── The engine ───────────────────────────────────────────────────────── */

export type CarouselSettleReason = 'scroll' | 'pointer';

export interface CarouselEngineOptions {
  orientation: () => CarouselOrientation;
  align: () => CarouselAlign;
  slidesPerMove: () => CarouselSlidesPerMove;
  transition: () => CarouselTransition;
  draggable: () => boolean;
  /** The page the binding holds, which the engine keeps in view across a resize. */
  page: () => number;
  /** The name a slide gets when the consumer gave it none, or `null` to leave it unnamed. */
  slideLabel?: ((index: number, count: number) => string | null) | undefined;
  /** The prefix of the identifier given to a slide that has none. */
  idPrefix?: string | undefined;
  onPages?: ((pages: CarouselPages, ids: string[]) => void) | undefined;
  /** The page nearest the scroll offset, while a gesture is still moving. */
  onVisualPage?: ((page: number) => void) | undefined;
  /** A gesture ended on a page: a swipe, a trackpad or a wheel (`scroll`), or a mouse drag (`pointer`). */
  onSettle?:
    ((page: number, reason: CarouselSettleReason, event: Event | undefined) => void) | undefined;
  onDraggingChange?: ((dragging: boolean) => void) | undefined;
  /** A swipe between stacked slides, `1` forward and `-1` back. */
  onSwipe?: ((delta: 1 | -1, event: PointerEvent) => void) | undefined;
  /** A press on a slide out of view, which the viewport received in its place. */
  onPeekPress?: ((slide: number, event: MouseEvent) => void) | undefined;
}

export interface CarouselEngineHandle {
  /** Reads the layout again and reports the pages. */
  measure: () => CarouselPages;
  pages: () => CarouselPages;
  /** Moves to a page: animated on the theme's motion scale, or at once. */
  scrollToPage: (page: number, options?: { animate?: boolean }) => void;
  /** Marks the slides of the current page; in `fade` that is what shows them. */
  setCurrent: (page: number) => void;
  /** The logical scroll offset. */
  offset: () => number;
  destroy: () => void;
}

function directionOf(element: Element): 'ltr' | 'rtl' {
  const view = element.ownerDocument.defaultView;
  const value = view?.getComputedStyle(element).direction;
  return value === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * The engine of one viewport. It reads the slides from the DOM every time it
 * measures, so a slide added, removed or resized is a new layout and nothing
 * the binding has to tell it about.
 */
export function createCarouselEngine(
  viewport: HTMLElement,
  options: CarouselEngineOptions,
): CarouselEngineHandle {
  const view = viewport.ownerDocument.defaultView;
  let metrics: CarouselMetrics = {
    viewport: 0,
    paddingStart: 0,
    paddingEnd: 0,
    maxScroll: 0,
    slides: [],
  };
  let pages: CarouselPages = EMPTY_PAGES;
  let animation: number | null = null;
  /** The spring in flight: where it set off, its target, its launch speed, its stiffness and when. */
  let spring: {
    from: number;
    target: number;
    velocity: number;
    omega: number;
    begin: number;
    overscroll: number;
    overscrollVelocity: number;
  } | null = null;
  /** How far content is pulled past an end, logical pixels, positive toward the inline end. */
  let overscroll = 0;
  let programmatic = false;
  let programmaticTimer: ReturnType<typeof setTimeout> | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  let visual = -1;
  let dragging = false;
  let destroyed = false;
  const written = new WeakMap<Element, string>();

  const vertical = () => options.orientation() === 'vertical';

  function slides(): HTMLElement[] {
    return [...viewport.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.matches(SLIDE_SELECTOR),
    );
  }

  function offset(): number {
    if (vertical()) return viewport.scrollTop;
    return Math.abs(viewport.scrollLeft);
  }

  function setOffset(value: number) {
    if (vertical()) {
      viewport.scrollTop = value;
      return;
    }
    viewport.scrollLeft = directionOf(viewport) === 'rtl' ? -value : value;
  }

  function read(): CarouselMetrics {
    const style = view?.getComputedStyle(viewport);
    const box = viewport.getBoundingClientRect();
    const rtl = directionOf(viewport) === 'rtl';
    const scroll = offset();
    if (vertical()) {
      return {
        viewport: viewport.clientHeight,
        paddingStart: Number.parseFloat(style?.paddingTop ?? '') || 0,
        paddingEnd: Number.parseFloat(style?.paddingBottom ?? '') || 0,
        maxScroll: Math.max(0, viewport.scrollHeight - viewport.clientHeight),
        slides: slides().map((slide) => {
          const rect = slide.getBoundingClientRect();
          return { start: rect.top - box.top - viewport.clientTop + scroll, size: rect.height };
        }),
      };
    }
    return {
      viewport: viewport.clientWidth,
      paddingStart:
        Number.parseFloat(rtl ? (style?.paddingRight ?? '') : (style?.paddingLeft ?? '')) || 0,
      paddingEnd:
        Number.parseFloat(rtl ? (style?.paddingLeft ?? '') : (style?.paddingRight ?? '')) || 0,
      maxScroll: Math.max(0, viewport.scrollWidth - viewport.clientWidth),
      slides: slides().map((slide) => {
        const rect = slide.getBoundingClientRect();
        const start = rtl ? box.right - rect.right : rect.left - box.left;
        return { start: start + scroll, size: rect.width };
      }),
    };
  }

  function writeInView() {
    const list = slides();
    const inView =
      options.transition() === 'fade'
        ? list.map((slide) => slide.hasAttribute('data-current'))
        : slidesInView(metrics, offset());
    for (const [index, slide] of list.entries()) {
      const visible = inView[index] ?? false;
      slide.toggleAttribute('data-inview', visible);
      if (visible) slide.removeAttribute('inert');
      else slide.setAttribute('inert', '');
    }
  }

  function measure(): CarouselPages {
    metrics = read();
    pages =
      options.transition() === 'fade'
        ? {
            positions: metrics.slides.map(() => 0),
            starts: metrics.slides.map((_, index) => index),
            pageOfSlide: metrics.slides.map((_, index) => index),
          }
        : carouselPages(metrics, {
            align: options.align(),
            slidesPerMove: options.slidesPerMove(),
          });

    const list = slides();
    const starts = new Set(pages.starts);
    const ids: string[] = [];
    for (const [index, slide] of list.entries()) {
      slide.toggleAttribute('data-snap', starts.has(index));
      if (slide.id === '') slide.id = `${options.idPrefix ?? 'slotted-carousel-slide-'}${index}`;
      ids.push(slide.id);
      const label = options.slideLabel?.(index, list.length) ?? null;
      const current = slide.getAttribute('aria-label');
      const owned =
        slide.hasAttribute('aria-labelledby') ||
        (current !== null && current !== written.get(slide));
      if (label !== null && !owned) {
        slide.setAttribute('aria-label', label);
        written.set(slide, label);
      }
    }
    options.onPages?.(pages, ids);
    return pages;
  }

  /**
   * Snap is off while the engine or a hand moves the scroller: a snapping
   * scroller pulls every intermediate position back to a page. The engine
   * writes the attribute itself, in the same task as the movement, because a
   * framework's render arrives a frame late and the first frames of a drag
   * were snapped back under the pointer.
   */
  function setMoving(moving: boolean) {
    viewport.toggleAttribute('data-moving', moving);
  }

  function writeOverscroll(value: number) {
    overscroll = Math.abs(value) < 0.25 ? 0 : value;
    if (overscroll === 0) {
      viewport.style.removeProperty('--slotted-carousel-overscroll');
      return;
    }
    const physical = !vertical() && directionOf(viewport) === 'rtl' ? -overscroll : overscroll;
    viewport.style.setProperty(
      '--slotted-carousel-overscroll',
      vertical() ? `0 ${physical.toFixed(2)}px` : `${physical.toFixed(2)}px 0`,
    );
  }

  function cancelAnimation() {
    if (animation !== null) view?.cancelAnimationFrame(animation);
    animation = null;
    spring = null;
    setMoving(dragging);
  }

  function markProgrammatic() {
    programmatic = true;
    if (programmaticTimer !== null) clearTimeout(programmaticTimer);
    programmaticTimer = setTimeout(() => {
      programmatic = false;
      programmaticTimer = null;
      writeInView();
    }, 120);
  }

  /** The spring's stiffness from the theme's long duration; `0` when motion is reduced. */
  function stiffness(): number {
    const style = view?.getComputedStyle(viewport);
    const duration = parseCssTime(style?.getPropertyValue('--_scroll-duration') ?? '');
    return duration <= 1 ? 0 : SPRING_STIFFNESS / duration;
  }

  /** Where the spring in flight stands now, and how fast it moves. */
  function inFlight(now: number) {
    if (spring === null)
      return { position: offset(), velocity: 0, overscroll, overscrollVelocity: 0 };
    const t = now - spring.begin;
    const main = springAt(spring.from, spring.target, spring.velocity, spring.omega, t);
    const pull = springAt(spring.overscroll, 0, spring.overscrollVelocity, spring.omega, t);
    return {
      position: main.position,
      velocity: main.velocity,
      overscroll: pull.position,
      overscrollVelocity: pull.velocity,
    };
  }

  /**
   * Moves to a page on a critically damped spring. The spring starts at the
   * speed the scroller already has — the speed of the hand that let go, or of
   * a movement this one interrupts — so there is no stop between a drag and
   * its landing, and pressing next twice carries the first press into the
   * second. Asked for the page it is already heading to, it keeps going.
   */
  function scrollToPage(
    page: number,
    scrollOptions: { animate?: boolean; velocity?: number } = {},
  ) {
    if (options.transition() === 'fade') return;
    const target = pages.positions[page];
    if (target === undefined) return;
    visual = page;
    if (spring !== null && Math.abs(spring.target - target) < EPSILON) return;

    const now = view?.performance.now() ?? 0;
    const state = inFlight(now);
    const omega = stiffness();
    if (animation !== null) view?.cancelAnimationFrame(animation);
    animation = null;
    spring = null;

    const settled = Math.abs(target - state.position) < EPSILON && overscroll === 0;
    if (scrollOptions.animate === false || omega === 0 || settled || view === null) {
      markProgrammatic();
      writeOverscroll(0);
      setOffset(target);
      setMoving(dragging);
      writeInView();
      return;
    }

    programmatic = true;
    setMoving(true);
    const from = state.position;
    spring = {
      from,
      target,
      velocity: springLaunch(from, target, scrollOptions.velocity ?? state.velocity, omega),
      omega,
      begin: now,
      overscroll: state.overscroll,
      overscrollVelocity: state.overscrollVelocity,
    };
    const frame = (time: number) => {
      const current = inFlight(time);
      writeOverscroll(current.overscroll);
      /* Under a pixel and barely moving the rest is a crawl the eye reads as a stall; it lands. */
      const done =
        Math.abs(current.position - target) < 1.5 &&
        Math.abs(current.velocity) < 0.08 &&
        Math.abs(current.overscroll) < 1;
      if (!done) {
        setOffset(current.position);
        animation = view.requestAnimationFrame(frame);
        return;
      }
      setOffset(target);
      writeOverscroll(0);
      animation = null;
      spring = null;
      setMoving(dragging);
      markProgrammatic();
      writeInView();
    };
    animation = view.requestAnimationFrame(frame);
  }

  function setCurrent(page: number) {
    const list = slides();
    for (const [index, slide] of list.entries()) {
      slide.toggleAttribute('data-current', pages.pageOfSlide[index] === page);
    }
    if (options.transition() === 'fade') writeInView();
  }

  function settle() {
    settleTimer = null;
    if (dragging || programmatic || options.transition() === 'fade') return;
    const page = nearestPage(pages.positions, offset());
    writeInView();
    if (page !== -1) options.onSettle?.(page, 'scroll', undefined);
  }

  const onScroll = () => {
    /* The scroll the engine's own movement caused is not a gesture. */
    if (programmatic) return;
    const page = nearestPage(pages.positions, offset());
    if (page !== visual && page !== -1) {
      visual = page;
      options.onVisualPage?.(page);
    }
    if (settleTimer !== null) clearTimeout(settleTimer);
    /* `scrollend` settles where it is supported; the timer is the fallback for an engine without it. */
    settleTimer = setTimeout(settle, 150);
  };

  const onScrollEnd = () => {
    if (settleTimer !== null) clearTimeout(settleTimer);
    settle();
  };

  /** A reader's own gesture interrupts the engine's movement. */
  const onInterrupt = () => {
    /* A pulled edge always springs home; only a page movement is the reader's to interrupt. */
    if (animation === null || overscroll !== 0) return;
    cancelAnimation();
    programmatic = false;
  };

  /* ── The mouse drag ── */

  let press: {
    pointer: number;
    x: number;
    y: number;
    offset: number;
    moved: boolean;
    samples: { at: number; value: number }[];
  } | null = null;
  let suppressClick = false;

  function axisDelta(event: PointerEvent): number {
    if (press === null) return 0;
    if (vertical()) return event.clientY - press.y;
    const delta = event.clientX - press.x;
    return directionOf(viewport) === 'rtl' ? -delta : delta;
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (options.transition() === 'fade') {
      press = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offset: 0,
        moved: false,
        samples: [],
      };
      return;
    }
    /* A press on a link or a button inside a slide drags too; the click after a drag is cancelled. */
    if (event.pointerType !== 'mouse' || !options.draggable()) return;
    /* A hand that catches the track mid-flight holds it where it is, pulled edge and all. */
    const caught = inFlight(view?.performance.now() ?? 0);
    cancelAnimation();
    programmatic = false;
    writeOverscroll(caught.overscroll);
    press = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offset: offset() - overscroll,
      moved: false,
      samples: [{ at: event.timeStamp, value: 0 }],
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (press === null || event.pointerId !== press.pointer || options.transition() === 'fade')
      return;
    const delta = axisDelta(event);
    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      press.moved = true;
      dragging = true;
      setMoving(true);
      viewport.setPointerCapture?.(event.pointerId);
      options.onDraggingChange?.(true);
    }
    event.preventDefault();
    /* Past an end the scroller cannot go, so the slides are pulled instead, less the further they go. */
    const raw = press.offset - delta;
    const next = Math.min(Math.max(raw, 0), metrics.maxScroll);
    setOffset(next);
    writeOverscroll(rubberBand(next - raw, metrics.viewport));
    press.samples.push({ at: event.timeStamp, value: delta });
    /* The release speed is read over the last tenth of a second, so a hand that stopped before letting go lands where it stopped. */
    while (press.samples.length > 2 && event.timeStamp - (press.samples[0]?.at ?? 0) > 100) {
      press.samples.shift();
    }
    const page = nearestPage(pages.positions, next);
    if (page !== visual && page !== -1) {
      visual = page;
      options.onVisualPage?.(page);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (press === null || event.pointerId !== press.pointer) return;
    const current = press;
    press = null;

    if (options.transition() === 'fade') {
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      const along = vertical() ? dy : directionOf(viewport) === 'rtl' ? -dx : dx;
      const across = vertical() ? dx : dy;
      if (Math.abs(along) >= SWIPE_THRESHOLD && Math.abs(along) > Math.abs(across)) {
        suppressClick = true;
        options.onSwipe?.(along < 0 ? 1 : -1, event);
      }
      return;
    }

    if (!current.moved) return;
    dragging = false;
    suppressClick = true;
    viewport.releasePointerCapture?.(event.pointerId);
    options.onDraggingChange?.(false);

    /**
     * Where the hand was taking the track decides the page. A release still
     * moving faster than a quarter of a pixel a millisecond goes one page in
     * the way it moves — the flick a reader means as "next" — and a slower one
     * lands on the page nearest where it would coast in a fifth of a second;
     * either way no further than one page from where the drag began. The
     * spring then sets off at the release speed, so the track never stops
     * between the hand and the landing.
     */
    const first = current.samples[0];
    const last = current.samples.at(-1);
    const pointerSpeed =
      first !== undefined &&
      last !== undefined &&
      last.at > first.at &&
      event.timeStamp - last.at < 60
        ? (last.value - first.value) / (last.at - first.at)
        : 0;
    const velocity = -pointerSpeed;
    const count = pages.positions.length;
    const start = nearestPage(pages.positions, current.offset);
    const projected = nearestPage(pages.positions, offset() - overscroll + velocity * 200);
    const flicked = Math.abs(velocity) > FLICK_SPEED ? start + Math.sign(velocity) : projected;
    const page = Math.min(Math.max(flicked, start - 1), start + 1, count - 1);
    scrollToPage(Math.max(page, 0), { animate: true, velocity });
    options.onSettle?.(Math.max(page, 0), 'pointer', event);
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const onClick = (event: MouseEvent) => {
    if (event.target !== viewport) return;
    const list = slides();
    for (const [index, slide] of list.entries()) {
      if (!slide.hasAttribute('inert')) continue;
      const rect = slide.getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        options.onPeekPress?.(index, event);
        return;
      }
    }
  };

  const onDragStart = (event: DragEvent) => {
    if (options.draggable()) event.preventDefault();
  };

  viewport.addEventListener('scroll', onScroll, { passive: true });
  viewport.addEventListener('scrollend', onScrollEnd);
  viewport.addEventListener('wheel', onInterrupt, { passive: true });
  viewport.addEventListener('touchstart', onInterrupt, { passive: true });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);
  viewport.addEventListener('click', onClickCapture, true);
  viewport.addEventListener('click', onClick);
  viewport.addEventListener('dragstart', onDragStart);

  const resize =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (destroyed) return;
          measure();
          const page = Math.min(options.page(), pages.positions.length - 1);
          if (page >= 0 && animation === null && !dragging) scrollToPage(page, { animate: false });
          else writeInView();
        });
  resize?.observe(viewport);

  const mutation =
    typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(() => {
          if (destroyed) return;
          for (const slide of slides()) resize?.observe(slide);
          measure();
          setCurrent(options.page());
          writeInView();
        });
  mutation?.observe(viewport, { childList: true });
  for (const slide of slides()) resize?.observe(slide);

  measure();

  return {
    measure,
    pages: () => pages,
    scrollToPage,
    setCurrent,
    offset,
    destroy() {
      destroyed = true;
      cancelAnimation();
      if (settleTimer !== null) clearTimeout(settleTimer);
      if (programmaticTimer !== null) clearTimeout(programmaticTimer);
      resize?.disconnect();
      mutation?.disconnect();
      viewport.removeEventListener('scroll', onScroll);
      viewport.removeEventListener('scrollend', onScrollEnd);
      viewport.removeEventListener('wheel', onInterrupt);
      viewport.removeEventListener('touchstart', onInterrupt);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('click', onClickCapture, true);
      viewport.removeEventListener('click', onClick);
      viewport.removeEventListener('dragstart', onDragStart);
    },
  };
}
