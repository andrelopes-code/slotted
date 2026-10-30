/**
 * A row that does not fit, and the two questions a paging control has to ask
 * about it: is there more, and is there more *this* way.
 *
 * Both bindings of `tabs` need the same answer, and a measurement written twice
 * is two answers. Nothing here knows about React or Angular; the arithmetic is
 * a pure function over four numbers, so the part that decides whether a control
 * is drawn is tested without a layout engine.
 *
 * The scroll offset is normalized on the way in. A right-to-left scroller
 * reports a negative `scrollLeft` — zero at the start, which is the right-hand
 * edge — so the distance from the start is its magnitude in both directions,
 * and every rule below is written once instead of mirrored.
 */

/**
 * The axis a row runs along. Named apart from `focus`'s own orientation
 * because the two entry points are separate modules and one barrel re-exports
 * both: two identical names there resolve to neither.
 */
export type ScrollOrientation = 'horizontal' | 'vertical';

export interface OverflowInput {
  /** Distance already scrolled from the start, as a magnitude. */
  scrollStart: number;
  /** The whole scrollable length. */
  scrollSize: number;
  /** The visible length. */
  clientSize: number;
  /**
   * How far from an end still counts as being at it. Sub-pixel layout leaves a
   * scroller a fraction short of its own end, and a paging control that never
   * disables is a control that does nothing when it is pressed.
   */
  tolerance?: number;
}

export interface OverflowState {
  /** Whether there is anything to scroll at all. */
  overflowing: boolean;
  /** Whether the start of the content is showing. */
  atStart: boolean;
  /** Whether the end of the content is showing. */
  atEnd: boolean;
}

export const NOT_OVERFLOWING: OverflowState = Object.freeze({
  overflowing: false,
  atStart: true,
  atEnd: true,
});

/** One page is most of the view, not all of it: the eye keeps a landmark. */
export const PAGE_FRACTION = 0.8;

const DEFAULT_TOLERANCE = 1;

export function overflowState({
  clientSize,
  scrollSize,
  scrollStart,
  tolerance = DEFAULT_TOLERANCE,
}: OverflowInput): OverflowState {
  const overflowing = scrollSize - clientSize > tolerance;
  if (!overflowing) return NOT_OVERFLOWING;

  const start = Math.abs(scrollStart);
  return {
    overflowing,
    atStart: start <= tolerance,
    atEnd: start + clientSize >= scrollSize - tolerance,
  };
}

export interface ScrollAffordanceOptions {
  /** Which way the row runs. Read at the time of each question. */
  orientation?: () => ScrollOrientation;
  /** Reports a new state, and only a new one. */
  onChange?: (state: OverflowState) => void;
}

export interface ScrollAffordanceHandle {
  /** Releases every observer and listener, and scrolls nothing. */
  destroy: () => void;
  /** Measures again, after an item arrives, leaves or changes size. */
  refresh: () => void;
  /** The last measurement. */
  state: () => OverflowState;
  /** Moves one page toward the start (`-1`) or the end (`1`). */
  page: (direction: -1 | 1) => void;
  /** Brings one item into view by the shortest movement that does it. */
  reveal: (item: Element) => void;
}

/**
 * Whether the reader asked the operating system for stillness.
 *
 * A CSS transition answers `prefers-reduced-motion` through the theme, which
 * collapses the duration scale under one query. A programmatic scroll is
 * outside that: `behavior: 'smooth'` is honored by the browser whatever the
 * setting says, so the setting is read here instead.
 */
function prefersReducedMotion(view: Window | null): boolean {
  return view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * Exported for `edges.ts`, which moves the same containers for the same reason
 * and must not answer the preference a second way.
 */
export function scrollBehaviorFor(container: Element): ScrollBehavior {
  return prefersReducedMotion(container.ownerDocument?.defaultView ?? null) ? 'auto' : 'smooth';
}

export function createScrollAffordance(
  container: HTMLElement,
  options: ScrollAffordanceOptions = {},
): ScrollAffordanceHandle {
  const orientation = options.orientation ?? (() => 'horizontal' as const);
  let current: OverflowState = NOT_OVERFLOWING;

  function measure(): OverflowState {
    return orientation() === 'vertical'
      ? overflowState({
          clientSize: container.clientHeight,
          scrollSize: container.scrollHeight,
          scrollStart: container.scrollTop,
        })
      : overflowState({
          clientSize: container.clientWidth,
          scrollSize: container.scrollWidth,
          scrollStart: container.scrollLeft,
        });
  }

  function refresh() {
    const next = measure();
    if (
      next.overflowing === current.overflowing &&
      next.atStart === current.atStart &&
      next.atEnd === current.atEnd
    ) {
      return;
    }
    current = next;
    options.onChange?.(current);
  }

  const observer =
    typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => refresh());
  observer?.observe(container);
  container.addEventListener('scroll', refresh, { passive: true });
  if (observer === undefined) refresh();

  return {
    destroy: () => {
      observer?.disconnect();
      container.removeEventListener('scroll', refresh);
    },
    refresh,
    state: () => current,
    page: (direction) => {
      /* A document with no layout engine — a test environment — implements
         neither of the two scrolling methods, and a family that assumed them
         would crash in every consumer's unit test. */
      if (typeof container.scrollBy !== 'function') return;
      const vertical = orientation() === 'vertical';
      const distance =
        (vertical ? container.clientHeight : container.clientWidth) * PAGE_FRACTION * direction;
      /**
       * `scrollBy` takes a physical delta, and a right-to-left scroller counts
       * the same physical direction downwards. Reversing the sign there is what
       * keeps "toward the end" meaning the same thing in both directions.
       */
      const mirrored =
        !vertical &&
        container.ownerDocument?.defaultView?.getComputedStyle?.(container)?.direction === 'rtl';
      container.scrollBy({
        behavior: scrollBehaviorFor(container),
        ...(vertical ? { top: distance } : { left: mirrored ? -distance : distance }),
      });
    },
    reveal: (item) => {
      /**
       * The container scrolls itself, along its own axis, and nothing else
       * moves. `scrollIntoView` would scroll every ancestor too: a tab list
       * below the fold of a page header brought the whole page down by the
       * tab's height on mount, before the reader had touched anything.
       */
      if (typeof container.scrollBy !== 'function') return;
      const vertical = orientation() === 'vertical';
      const box = container.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      const start = vertical ? rect.top - box.top : rect.left - box.left;
      const end = vertical ? rect.bottom - box.top : rect.right - box.left;
      const size = vertical ? container.clientHeight : container.clientWidth;
      const delta = start < 0 ? start : end > size ? end - size : 0;
      if (delta === 0) return;
      container.scrollBy({
        behavior: scrollBehaviorFor(container),
        ...(vertical ? { top: delta } : { left: delta }),
      });
    },
  };
}
