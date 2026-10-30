import { findScrollParent, STICKY_TOP_PROPERTY } from '../sticky-header';

/**
 * Which of a set of targets the reader is at, and how to take them to one.
 *
 * The reading line is a distance from the top of the scroller — the page's
 * chrome, plus what the consumer adds, plus a tolerance — and the current
 * target is the last one whose top edge is at or above it. Two cases the
 * rule alone gets wrong are handled beside it: a scroller at its end makes
 * the last target current, because a final section shorter than the
 * scrollport never reaches the line, and a scroller at its start makes the
 * first target current, because the reader is at it however much padding
 * stands above it; and a target with no box is never current, because a
 * heading inside a closed disclosure is not a place the reader can be.
 *
 * An `IntersectionObserver` with a one-pixel band at the reading line says
 * when a target crosses it or changes its box, and a passive scroll listener,
 * coalesced to one frame, covers what the observer cannot see: the end of the
 * scroller, and a line that moved because the page's header collapsed. Both
 * end in the same recomputation by geometry, so the answer never depends on
 * which of the two spoke.
 *
 * Nothing here is framework-specific, and nothing here holds the value: the
 * binding owns `value`, asks with the reason `scroll`, and may be refused.
 */

export interface ScrollSpyOptions {
  /** The targets, in document order. Read at every recomputation. */
  targets: () => HTMLElement[];
  /**
   * The element that scrolls. `null` is the viewport; `undefined` derives it
   * from the first target's nearest scrolling ancestor, which is the page's
   * body inside `page` and the viewport outside one.
   */
  scroller?: HTMLElement | null | undefined;
  /** The reading line, in CSS pixels from the scroller's top edge. Read at every recomputation. */
  line: () => number;
  /** The current target changed. `null` while no target has reached the line. */
  onChange: (id: string | null) => void;
  /**
   * The family's own root. A gesture inside it — the press on a link, Enter on
   * one — is a choice, not a scroll, and does not release a pinned target.
   */
  own?: HTMLElement | null | undefined;
}

export interface ScrollSpyHandle {
  /** The current target's id, or `null`. */
  current: () => string | null;
  /**
   * The reader chose a target: it is current until they scroll again by a
   * gesture — wheel, touch, keyboard, a press on the scrollbar. A choice that
   * lands the document at its end would otherwise be overruled by the rule
   * that marks the last target there, on the same frame the reader pressed
   * the one before it; the scroll the family drives to the choice is not a
   * gesture and does not release it.
   */
  pin: (id: string) => void;
  /** The element the targets scroll inside, or `null` for the viewport. */
  scroller: () => HTMLElement | null;
  /** Measures again — after the targets changed, or on demand. */
  refresh: () => void;
  destroy: () => void;
}

export interface LandOptions {
  /** The element that scrolls, or `null` for the viewport. */
  scroller: HTMLElement | null;
  /** The height of the chrome that stays above the content: `readStickyTop`. */
  chrome: number;
  /** What the consumer adds under the chrome. */
  offset?: number;
  behavior?: ScrollBehavior;
}

/** The custom property `page` writes on the element that scrolls: where its chrome ends. */
export const STICKY_TOP = STICKY_TOP_PROPERTY;

function hasBox(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function scrollerTop(scroller: HTMLElement | null): number {
  return scroller === null ? 0 : scroller.getBoundingClientRect().top;
}

/**
 * Where the page's chrome ends, read from the property `page` publishes on
 * the element that scrolls — on the document element when the viewport
 * scrolls. Zero outside a page, and zero when the page has not measured yet.
 *
 * Read from the inline style `page` writes it to, not from the computed style:
 * the spy reads it on every scrolled frame, and a computed style there forced
 * a style recalc of the whole document each frame.
 */
export function readStickyTop(scroller: HTMLElement | null, doc: Document): number {
  const target = scroller ?? doc.documentElement;
  const value = Number.parseFloat(target.style.getPropertyValue(STICKY_TOP));
  return Number.isFinite(value) ? value : 0;
}

/** The scroller the targets scroll inside, derived from the first of them. */
export function resolveScroller(targets: readonly HTMLElement[]): HTMLElement | null {
  const first = targets[0];
  return first === undefined ? null : findScrollParent(first);
}

/**
 * Which target is current for a given line, by geometry alone. Exported so a
 * binding can compute the answer at mount — before any observer has spoken —
 * and so the rule is testable with rectangles.
 */
export function currentTarget(
  targets: readonly HTMLElement[],
  scroller: HTMLElement | null,
  line: number,
): HTMLElement | null {
  const visible = targets.filter(hasBox);
  if (visible.length === 0) return null;

  const view = (visible[0] as HTMLElement).ownerDocument.defaultView;
  const top = scrollerTop(scroller);
  const atEnd =
    scroller === null
      ? view !== null &&
        Math.ceil(view.scrollY + view.innerHeight) >= view.document.documentElement.scrollHeight
      : Math.ceil(scroller.scrollTop + scroller.clientHeight) >= scroller.scrollHeight;
  if (atEnd) return visible[visible.length - 1] as HTMLElement;

  let current: HTMLElement | null = null;
  for (const target of visible) {
    if (target.getBoundingClientRect().top - top <= line) current = target;
    else break;
  }
  if (current !== null) return current;

  /*
   * Nothing has reached the line and the scroller is at its start: the reader
   * is at the first target, a few pixels of padding short of the line, and a
   * list with nothing marked while the document sits at its top says the
   * reader is nowhere. Scrolled away from the start with nothing reached, they
   * are between the top and the first target, and nothing is marked.
   */
  const atStart = scroller === null ? view !== null && view.scrollY <= 0 : scroller.scrollTop <= 0;
  return atStart ? (visible[0] as HTMLElement) : null;
}

export function createScrollSpy(options: ScrollSpyOptions): ScrollSpyHandle {
  const initial = options.targets();
  const doc = (initial[0] ?? document).ownerDocument ?? document;
  const view = doc.defaultView;
  const scroller = options.scroller === undefined ? resolveScroller(initial) : options.scroller;
  const scrollSource: EventTarget | null = scroller ?? view;

  let current: string | null = null;
  let pinned: string | null = null;
  let observer: IntersectionObserver | null = null;
  let frame = 0;
  let destroyed = false;

  const compute = () => {
    if (destroyed) return;
    const next = pinned ?? currentTarget(options.targets(), scroller, options.line())?.id ?? null;
    const id = next;
    if (id === current) return;
    current = id;
    options.onChange(id);
  };

  const schedule = () => {
    if (view === null || frame !== 0) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      compute();
    });
  };

  /**
   * The band: one pixel tall at the reading line. A callback arrives when a
   * target's box starts or stops covering it, which is exactly when the
   * answer can change without a scroll — a target resized, shown or hidden.
   */
  const observe = () => {
    observer?.disconnect();
    observer = null;
    if (typeof IntersectionObserver === 'undefined' || view === null) return;
    const height = scroller === null ? view.innerHeight : scroller.clientHeight;
    const line = Math.max(0, Math.round(options.line()));
    const below = Math.max(0, height - line - 1);
    observer = new IntersectionObserver(() => compute(), {
      root: scroller,
      rootMargin: `-${line}px 0px -${below}px 0px`,
      threshold: 0,
    });
    for (const target of options.targets()) observer.observe(target);
  };

  const refresh = () => {
    observe();
    compute();
  };

  scrollSource?.addEventListener('scroll', schedule, { passive: true });
  view?.addEventListener('resize', refresh);

  /** A gesture releases a pinned choice; the family's own smooth scroll is not one, and neither is a press inside the family. */
  const release = (event: Event) => {
    if (pinned === null) return;
    const own = options.own;
    if (own instanceof HTMLElement && event.target instanceof Node && own.contains(event.target)) {
      return;
    }
    pinned = null;
    schedule();
  };
  const gestures = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;
  for (const gesture of gestures)
    scrollSource?.addEventListener(gesture, release, { passive: true });
  let resize: ResizeObserver | null = null;
  if (scroller !== null && typeof ResizeObserver !== 'undefined') {
    resize = new ResizeObserver(refresh);
    resize.observe(scroller);
  }
  refresh();

  return {
    current: () => current,
    pin: (id) => {
      pinned = id;
      compute();
    },
    scroller: () => scroller,
    refresh,
    destroy: () => {
      destroyed = true;
      observer?.disconnect();
      resize?.disconnect();
      scrollSource?.removeEventListener('scroll', schedule);
      for (const gesture of gestures) scrollSource?.removeEventListener(gesture, release);
      view?.removeEventListener('resize', refresh);
      if (frame !== 0) view?.cancelAnimationFrame(frame);
    },
  };
}

/**
 * Where a target lands: its top edge under the chrome, plus its own
 * `scroll-margin-block-start` when that margin is smaller than the chrome. A
 * margin at least the chrome's height is taken to include it — `section`
 * writes its margin from the same property — and a smaller one is the air a
 * family asked for above its heading, which `prose` states in its own flow
 * unit, and it is kept.
 */
export function landingLine(target: HTMLElement, chrome: number, offset = 0): number {
  const view = target.ownerDocument.defaultView;
  const margin =
    view === null
      ? 0
      : Number.parseFloat(view.getComputedStyle(target).scrollMarginBlockStart) || 0;
  return chrome > 0 && margin >= chrome ? margin + offset : chrome + offset + margin;
}

/** Scrolls the scroller so `target` lands at its landing line. */
export function landOn(target: HTMLElement, options: LandOptions): void {
  const view = target.ownerDocument.defaultView;
  if (view === null) return;
  const { scroller } = options;
  const line = landingLine(target, options.chrome, options.offset ?? 0);
  const rect = target.getBoundingClientRect();
  const behavior = options.behavior ?? 'auto';
  if (scroller === null) {
    view.scrollTo({ top: view.scrollY + rect.top - line, behavior });
  } else {
    scroller.scrollTo({
      top: scroller.scrollTop + rect.top - scrollerTop(scroller) - line,
      behavior,
    });
  }
}

/**
 * Focus on the target the reader chose, so a screen reader continues from
 * the section and not from the list. A fragment navigation moves only the
 * sequential focus starting point; this moves focus, without scrolling, and
 * a target that cannot take it is given `tabindex="-1"` until it blurs.
 */
export function focusTarget(target: HTMLElement): void {
  if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }
  target.focus({ preventScroll: true });
}

/** Whether the reader asked for less motion; the smooth scroll becomes an instant one. */
export function prefersReducedMotion(view: Window | null): boolean {
  return (
    view !== null &&
    typeof view.matchMedia === 'function' &&
    view.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
