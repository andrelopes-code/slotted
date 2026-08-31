/**
 * The arithmetic of rendering part of a list and claiming all of it.
 *
 * Written against VirtualList, its first and so far only caller. The rule is
 * that a core module is designed against a real caller's requirements and
 * stays malleable until a second caller confirms it, so this signature is
 * provisional until Listbox and Calendar have had their say in T3.
 *
 * It assumes every row is the same size. A measured variant replaces the two
 * multiplications here with a lookup and brings a scroll-anchoring policy with
 * it, which is a product decision and not this module's to take in advance.
 *
 * Nothing here touches the DOM or a framework. It is arithmetic.
 */

import { clamp } from '../measure';

export interface VirtualWindowInput {
  /** How many rows the list has, whether or not they are rendered. */
  itemCount: number;
  /** The block size of one row, in pixels. */
  itemSize: number;
  /** Rows to render either side of the viewport. Nought unless asked for. */
  overscan?: number;
  /** How far the container has scrolled, in pixels. */
  scrollOffset: number;
  /** The block size of the scrolling container, in pixels. */
  viewportSize: number;
}

export interface VirtualWindow {
  /** The first row to render. */
  startIndex: number;
  /** One past the last row to render, so the pair slices. */
  endIndex: number;
  /** Where `startIndex` sits inside the canvas, in pixels. */
  startOffset: number;
  /** The block size of the whole list, which is the canvas's size. */
  totalSize: number;
}

const EMPTY: VirtualWindow = { startIndex: 0, endIndex: 0, startOffset: 0, totalSize: 0 };

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
export function virtualWindow({
  itemCount,
  itemSize,
  overscan = 0,
  scrollOffset,
  viewportSize,
}: VirtualWindowInput): VirtualWindow {
  if (itemCount <= 0 || itemSize <= 0) return { ...EMPTY };

  const buffer = Math.max(overscan, 0);
  const viewport = Math.max(viewportSize, 0);
  const totalSize = itemCount * itemSize;
  const offset = clamp(scrollOffset, 0, Math.max(totalSize - viewport, 0));

  const startIndex = clamp(Math.floor(offset / itemSize) - buffer, 0, itemCount - 1);
  const endIndex = clamp(Math.ceil((offset + viewport) / itemSize) + buffer, startIndex, itemCount);

  return { startIndex, endIndex, startOffset: startIndex * itemSize, totalSize };
}
