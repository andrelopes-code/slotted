/**
 * The same question `overflow.ts` answers, asked about both axes at once and
 * answered in logical names.
 *
 * `createScrollAffordance` measures one axis, because the family that asked for
 * it — `tabs` — has one. A scroll area has two, and two handles on one element
 * would be two `ResizeObserver`s and two scroll listeners measuring the same
 * box on the same frame.
 *
 * The names are logical because the attributes they become are: a right-to-left
 * document and a vertical writing mode read `block-start` and `inline-end` the
 * same way, so the stylesheet writes each rule once. The arithmetic is
 * `overflowState`, unchanged, which already reads a mirrored scroller by the
 * magnitude of its offset rather than by the sign.
 */

import type { OverflowState } from './overflow';
import { NOT_OVERFLOWING, overflowState, scrollBehaviorFor } from './overflow';

export interface ScrollEdgesState {
  /** Down the page in a horizontal writing mode, across it in a vertical one. */
  readonly block: OverflowState;
  /** Along the reading direction. */
  readonly inline: OverflowState;
}

export const NO_SCROLL_EDGES: ScrollEdgesState = Object.freeze({
  block: NOT_OVERFLOWING,
  inline: NOT_OVERFLOWING,
});

export interface ScrollEdgesOptions {
  /** Reports a new state, and only a new one. */
  onChange?: (state: ScrollEdgesState) => void;
}

export type LogicalEdge = 'block-start' | 'block-end' | 'inline-start' | 'inline-end';

/**
 * Where the scroller is, as a distance from each logical start. Never signed:
 * a mirrored scroller counts its own start as zero and goes negative, and a
 * consumer persisting a position should not have to know that.
 */
export interface ScrollPosition {
  readonly block: number;
  readonly inline: number;
}

export interface ScrollEdgesHandle {
  /** Releases every observer and listener, and scrolls nothing. */
  destroy: () => void;
  /** Measures again, after content arrives, leaves or changes size. */
  refresh: () => void;
  /** The last measurement. */
  state: () => ScrollEdgesState;
  /**
   * Whether the block axis runs across the page — a vertical writing mode.
   * Only script can read one, and the stylesheet needs to know: a gradient
   * cannot be given a logical direction, so the veil is dropped there.
   */
  sideways: () => boolean;
  /** The distance from each logical start, read now. */
  position: () => ScrollPosition;
  /** Moves to a logical position. An axis left out is an axis left alone. */
  scrollTo: (target: Partial<ScrollPosition>) => void;
  /** Moves to one end of one axis. */
  scrollToEdge: (edge: LogicalEdge) => void;
  /** Brings one item into view by the shortest movement that does it, on both axes. */
  reveal: (item: Element) => void;
}

/**
 * `writing-mode` values whose block axis runs across the page rather than down
 * it. The CSS Writing Modes keywords are `horizontal-tb`, `vertical-rl`,
 * `vertical-lr`, `sideways-rl` and `sideways-lr`; the last four are the ones
 * that turn the box, and the first is the initial value.
 */
const SIDEWAYS_BLOCK = /^(?:vertical|sideways)/;

/**
 * How the two logical axes land on the two physical ones, and which way each
 * one counts. The block axis runs across the page in a vertical writing mode,
 * and in `vertical-rl` it runs from the right — so its physical offset is
 * negative, the way a right-to-left inline axis is. `sideways-lr` turns the
 * inline axis upward as well; it is not read here, and a scroller in it moves
 * along the wrong sign on that one axis.
 */
interface Axes {
  readonly across: boolean;
  readonly blockNegative: boolean;
  readonly inlineNegative: boolean;
}

function readAxes(container: HTMLElement): Axes {
  const style = container.ownerDocument?.defaultView?.getComputedStyle?.(container);
  const mode = typeof style?.writingMode === 'string' ? style.writingMode : 'horizontal-tb';
  return {
    across: SIDEWAYS_BLOCK.test(mode),
    blockNegative: mode === 'vertical-rl' || mode === 'sideways-rl',
    inlineNegative: style?.direction === 'rtl',
  };
}

function same(a: OverflowState, b: OverflowState): boolean {
  return a.overflowing === b.overflowing && a.atStart === b.atStart && a.atEnd === b.atEnd;
}

export function createScrollEdges(
  container: HTMLElement,
  options: ScrollEdgesOptions = {},
): ScrollEdgesHandle {
  let current: ScrollEdgesState = NO_SCROLL_EDGES;

  /**
   * Read when the box is measured and not when it is scrolled.
   * `getComputedStyle` is a layout read, a scroll fires one event per frame,
   * and a writing mode does not change during a scroll — it changes when the
   * element or its ancestors are restyled, which resizes the box.
   */
  let axes = readAxes(container);

  function measure(): ScrollEdgesState {
    const { across } = axes;
    const horizontal = overflowState({
      clientSize: container.clientWidth,
      scrollSize: container.scrollWidth,
      scrollStart: container.scrollLeft,
    });
    const vertical = overflowState({
      clientSize: container.clientHeight,
      scrollSize: container.scrollHeight,
      scrollStart: container.scrollTop,
    });
    return across
      ? { block: horizontal, inline: vertical }
      : { block: vertical, inline: horizontal };
  }

  function update(remeasureWritingMode: boolean) {
    if (remeasureWritingMode) axes = readAxes(container);
    const next = measure();
    if (same(next.block, current.block) && same(next.inline, current.inline)) return;
    current = next;
    options.onChange?.(current);
  }

  const onScroll = () => update(false);
  const observer =
    typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => update(true));

  observer?.observe(container);
  container.addEventListener('scroll', onScroll, { passive: true });
  update(false);

  /** The physical offset an axis is at, as a magnitude. */
  function position(): ScrollPosition {
    const horizontal = Math.abs(container.scrollLeft);
    const vertical = Math.abs(container.scrollTop);
    return axes.across
      ? { block: horizontal, inline: vertical }
      : { block: vertical, inline: horizontal };
  }

  /* A document with no layout engine — a test environment — implements
     neither scrolling method, and a family that assumed them would crash in
     every consumer's unit test. */
  const canScroll = () => typeof container.scrollTo === 'function';

  function scrollTo(target: Partial<ScrollPosition>) {
    if (!canScroll()) return;
    const { across, blockNegative, inlineNegative } = axes;
    const options: ScrollToOptions = { behavior: scrollBehaviorFor(container) };

    if (target.block !== undefined) {
      const distance = blockNegative ? -target.block : target.block;
      if (across) options.left = distance;
      else options.top = distance;
    }
    if (target.inline !== undefined) {
      const distance = inlineNegative ? -target.inline : target.inline;
      if (across) options.top = distance;
      else options.left = distance;
    }
    container.scrollTo(options);
  }

  function scrollToEdge(edge: LogicalEdge) {
    const [axis, end] = edge.split('-') as ['block' | 'inline', 'start' | 'end'];
    const horizontal = axes.across ? axis === 'block' : axis === 'inline';
    const extent = horizontal
      ? container.scrollWidth - container.clientWidth
      : container.scrollHeight - container.clientHeight;
    scrollTo({ [axis]: end === 'start' ? 0 : Math.max(extent, 0) });
  }

  /**
   * The container scrolls itself, on its own two axes, and nothing else moves.
   * `scrollIntoView` would scroll every ancestor too — the defect `tabs`
   * recorded, where a list below the fold brought the whole page down on
   * mount. Physical deltas, because a delta is the same sign in every
   * direction and writing mode.
   */
  function reveal(item: Element) {
    if (typeof container.scrollBy !== 'function') return;
    const box = container.getBoundingClientRect();
    const rect = item.getBoundingClientRect();

    const shortest = (start: number, end: number, size: number) =>
      start < 0 ? start : end > size ? end - size : 0;
    const top = shortest(rect.top - box.top, rect.bottom - box.top, container.clientHeight);
    const left = shortest(rect.left - box.left, rect.right - box.left, container.clientWidth);

    if (top === 0 && left === 0) return;
    container.scrollBy({ top, left, behavior: scrollBehaviorFor(container) });
  }

  return {
    destroy: () => {
      observer?.disconnect();
      container.removeEventListener('scroll', onScroll);
    },
    refresh: () => update(true),
    state: () => current,
    sideways: () => axes.across,
    position,
    scrollTo,
    scrollToEdge,
    reveal,
  };
}

/**
 * The measurement as the DOM says it, so both bindings write one vocabulary.
 *
 * An edge attribute says the reader can see that end of the content, which is
 * why a rule paints an affordance in its *absence*: the negative form is the
 * one a stylesheet can write without `:not()` around every selector, and an
 * axis that does not overflow shows both of its ends.
 */
export function scrollEdgeAttributes(state: ScrollEdgesState): Record<string, string> {
  const attributes: Record<string, string> = {};

  const axis =
    state.block.overflowing && state.inline.overflowing
      ? 'both'
      : state.block.overflowing
        ? 'block'
        : state.inline.overflowing
          ? 'inline'
          : undefined;
  if (axis !== undefined) attributes['data-overflowing'] = axis;

  if (state.block.atStart) attributes['data-at-block-start'] = '';
  if (state.block.atEnd) attributes['data-at-block-end'] = '';
  if (state.inline.atStart) attributes['data-at-inline-start'] = '';
  if (state.inline.atEnd) attributes['data-at-inline-end'] = '';

  return attributes;
}
