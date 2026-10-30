/**
 * The arithmetic of rendering part of a list and claiming all of it.
 *
 * Written against VirtualList, reviewed against Listbox — the first caller that
 * windows a collection **and** selects inside it at the same time. That pairing
 * is what the original signature could not answer, and it produced four
 * failures. Two of them are answered here:
 *
 * 1. a window computed from the scroll offset alone recycles the option
 *    `aria-activedescendant` points at, and the property then references an id
 *    that is not in the document — so the window takes `pinned` indices that are
 *    rendered whether or not the viewport covers them;
 * 2. a group label is not the same height as an option, so the single
 *    multiplication drifts further from the canvas with every group — hence
 *    `createRowMetrics`, a prefix-sum table with a binary search, taken instead
 *    of `itemSize` when the rows differ.
 *
 * The uniform path is unchanged and is still two multiplications, because it is
 * the path every ungrouped list takes.
 *
 * Sizes are stated by the caller, never read from the DOM. The measured variant
 * — a row whose height depends on how its own text wrapped — is still deferred,
 * and it brings a scroll-anchoring policy with it that is a product decision
 * rather than this module's.
 *
 * Nothing here touches the DOM or a framework. It is arithmetic.
 */

import { clamp } from '../measure';

/**
 * Where each row starts and how tall it is, for a list whose rows differ.
 *
 * Built once per row list rather than per frame: the prefix sum is O(n) to
 * build and the lookup is O(log n), where recomputing it inside the window
 * would be O(n) on every scroll event.
 */
export interface RowMetrics {
  /** How many rows the table describes. */
  readonly count: number;
  /** The block size of every row together, which is the canvas's size. */
  readonly totalSize: number;
  /** Where a row starts, in pixels. Out of range clamps to an end. */
  offsetOf: (index: number) => number;
  /** The block size of one row, in pixels. Nought outside the table. */
  sizeOf: (index: number) => number;
  /** The row an offset falls inside, clamped into the table. */
  indexAt: (offset: number) => number;
}

/**
 * A prefix-sum table over stated row sizes.
 *
 * A negative or non-finite size is read as nought rather than rejected. The
 * value reaches this from a template or a provider, where one `NaN` would
 * otherwise poison every offset after it and produce a canvas of `NaN` pixels
 * that no caller could trace back to its row.
 */
export function createRowMetrics(sizes: readonly number[]): RowMetrics {
  const count = sizes.length;
  /* One longer than the list: `offsets[i]` is where row `i` starts, and the
     final entry is the total, so `sizeOf` is one subtraction at every index. */
  const offsets = new Float64Array(count + 1);
  for (let index = 0; index < count; index += 1) {
    const size = sizes[index] ?? 0;
    offsets[index + 1] =
      (offsets[index] as number) + (Number.isFinite(size) ? Math.max(size, 0) : 0);
  }

  const totalSize = offsets[count] as number;

  return {
    count,
    totalSize,
    offsetOf: (index) => offsets[clamp(index, 0, count)] as number,
    sizeOf: (index) =>
      index < 0 || index >= count ? 0 : (offsets[index + 1] as number) - (offsets[index] as number),
    indexAt: (offset) => {
      if (count === 0) return 0;
      const target = clamp(offset, 0, totalSize);
      let low = 0;
      let high = count - 1;
      while (low < high) {
        const middle = (low + high + 1) >> 1;
        if ((offsets[middle] as number) <= target) low = middle;
        else high = middle - 1;
      }
      return low;
    },
  };
}

export interface VirtualWindowInput {
  /** How many rows the list has, whether or not they are rendered. */
  itemCount: number;
  /** The block size of one row, in pixels. Ignored when `metrics` is given. */
  itemSize?: number;
  /** Where each row starts, for a list whose rows differ in size. */
  metrics?: RowMetrics | undefined;
  /** Rows to render either side of the viewport. Nought unless asked for. */
  overscan?: number;
  /** How far the container has scrolled, in pixels. */
  scrollOffset: number;
  /** The block size of the scrolling container, in pixels. */
  viewportSize: number;
  /**
   * Rows that are rendered whether or not the viewport covers them.
   *
   * The active option and the range anchor: an `aria-activedescendant` whose
   * target has been recycled references an id that is not in the document, and
   * the reader is then operating a widget with no focused option at all. Out of
   * range indices are dropped rather than rejected, because the active index is
   * -1 for as long as nothing is active.
   */
  pinned?: readonly number[] | undefined;
}

export interface VirtualWindow {
  /** The first row of the contiguous slice. */
  startIndex: number;
  /** One past the last row of the slice, so the pair slices. */
  endIndex: number;
  /** Where `startIndex` sits inside the canvas, in pixels. */
  startOffset: number;
  /** The block size of the whole list, which is the canvas's size. */
  totalSize: number;
  /**
   * Pinned rows before the slice, ascending, and pinned rows at or after it.
   * They are returned apart from the slice so a caller renders
   * `[...pinnedBefore, …slice, ...pinnedAfter]` without de-duplicating by hand.
   */
  pinnedBefore: readonly number[];
  pinnedAfter: readonly number[];
}

const EMPTY: VirtualWindow = {
  startIndex: 0,
  endIndex: 0,
  startOffset: 0,
  totalSize: 0,
  pinnedBefore: [],
  pinnedAfter: [],
};

function readMetrics(input: VirtualWindowInput) {
  const { itemCount, itemSize = 0, metrics } = input;
  if (metrics !== undefined) {
    const count = Math.min(itemCount, metrics.count);
    return count <= 0 || metrics.totalSize <= 0 ? undefined : { count, metrics };
  }
  return itemCount <= 0 || itemSize <= 0 ? undefined : { count: itemCount, size: itemSize };
}

/**
 * The rows to render for a scroll position, and the two sizes that must agree
 * with them. One function rather than four, because a caller given four would
 * derive three of them and take the fourth, and the derivation is where a
 * window and its canvas drift apart.
 *
 * A count or a size of nought is a list that is loading, not a caller error,
 * and it returns an empty window. An offset outside the list is clamped into
 * it, which is what a rubber-band overscroll produces on every frame.
 *
 * An unmeasured viewport — nought, which is what the first render on a server
 * and the first render on a client both see — yields the overscan buffer and
 * nothing else. That falls out of the arithmetic rather than being a case
 * inside it, and it is why server-rendered markup holds the top of the list
 * instead of an empty box.
 */
export function virtualWindow(input: VirtualWindowInput): VirtualWindow {
  const resolved = readMetrics(input);
  if (resolved === undefined) return { ...EMPTY, pinnedBefore: [], pinnedAfter: [] };

  const { count } = resolved;
  const buffer = Math.max(input.overscan ?? 0, 0);
  const viewport = Math.max(input.viewportSize, 0);

  const totalSize = 'metrics' in resolved ? resolved.metrics.totalSize : count * resolved.size;
  const offset = clamp(input.scrollOffset, 0, Math.max(totalSize - viewport, 0));

  let first: number;
  let last: number;
  if ('metrics' in resolved) {
    const { metrics } = resolved;
    first = metrics.indexAt(offset);
    /* One past the row the far edge falls in. `indexAt` clamps, so a viewport
       that reaches the end of the canvas answers with the last row and the
       `+ 1` turns it into the exclusive bound the pair needs. */
    last = metrics.indexAt(offset + viewport) + 1;
  } else {
    first = Math.floor(offset / resolved.size);
    last = Math.ceil((offset + viewport) / resolved.size);
  }

  const startIndex = clamp(first - buffer, 0, count - 1);
  const endIndex = clamp(last + buffer, startIndex, count);
  const startOffset =
    'metrics' in resolved ? resolved.metrics.offsetOf(startIndex) : startIndex * resolved.size;

  const pinnedBefore: number[] = [];
  const pinnedAfter: number[] = [];
  for (const index of input.pinned ?? []) {
    if (!Number.isInteger(index) || index < 0 || index >= count) continue;
    if (index < startIndex && !pinnedBefore.includes(index)) pinnedBefore.push(index);
    else if (index >= endIndex && !pinnedAfter.includes(index)) pinnedAfter.push(index);
  }
  pinnedBefore.sort((a, b) => a - b);
  pinnedAfter.sort((a, b) => a - b);

  return { startIndex, endIndex, startOffset, totalSize, pinnedBefore, pinnedAfter };
}

/** Where a row should be brought to inside the viewport. */
export type ScrollAlignment = 'start' | 'center' | 'end' | 'nearest';

export interface OffsetForIndexInput {
  /** The row to reveal. */
  index: number;
  itemCount: number;
  itemSize?: number;
  metrics?: RowMetrics | undefined;
  /** Where the container has scrolled to now. */
  scrollOffset: number;
  viewportSize: number;
  /** `nearest` moves as little as possible, which is what a key press wants. */
  align?: ScrollAlignment;
}

/**
 * The scroll offset that brings a row into view, so the same number drives the
 * scroll in React and in Angular.
 *
 * `Home` in a windowed list of ten thousand moves the active row to nought,
 * which is nowhere near the current window: the scroll has to be driven from
 * the index rather than the index read back from the scroll. `nearest` is what
 * an arrow key takes — a row already fully visible does not move the list at
 * all — and the other three are what an imperative `scrollToKey()` takes.
 */
export function offsetForIndex(input: OffsetForIndexInput): number {
  const resolved = readMetrics(input);
  if (resolved === undefined) return 0;

  const { count } = resolved;
  const index = clamp(input.index, 0, count - 1);
  const viewport = Math.max(input.viewportSize, 0);
  const totalSize = 'metrics' in resolved ? resolved.metrics.totalSize : count * resolved.size;
  const start = 'metrics' in resolved ? resolved.metrics.offsetOf(index) : index * resolved.size;
  const size = 'metrics' in resolved ? resolved.metrics.sizeOf(index) : resolved.size;
  const end = start + size;

  const maximum = Math.max(totalSize - viewport, 0);
  const current = clamp(input.scrollOffset, 0, maximum);

  const target = (() => {
    switch (input.align ?? 'nearest') {
      case 'start':
        return start;
      case 'end':
        return end - viewport;
      case 'center':
        return start - (viewport - size) / 2;
      default: {
        if (start < current) return start;
        if (end > current + viewport) return end - viewport;
        return current;
      }
    }
  })();

  return clamp(target, 0, maximum);
}

export interface LoadMoreInput {
  /** One past the last rendered row, which is the window's own `endIndex`. */
  endIndex: number;
  /** How many rows have been loaded so far. */
  loadedCount: number;
  /**
   * How many rows before the end of the loaded set the request goes out. Nought
   * asks only once the last loaded row is rendered, which is the honest default:
   * a larger number is a claim about how fast the consumer's fetch returns.
   */
  threshold?: number;
  /** Whether the consumer has more to give. */
  hasMore: boolean;
  /** Whether a request is already out. */
  loading: boolean;
}

/**
 * Whether the window has come close enough to the end of the loaded set to ask
 * for more.
 *
 * It is a question rather than a side effect: the engine holds no timer, no
 * observer and no promise, so the same rule is testable without a DOM and the
 * fetch stays the consumer's.
 */
export function shouldLoadMore({
  endIndex,
  loadedCount,
  threshold = 0,
  hasMore,
  loading,
}: LoadMoreInput): boolean {
  if (!hasMore || loading) return false;
  if (loadedCount <= 0) return true;
  return endIndex >= loadedCount - Math.max(threshold, 0);
}
