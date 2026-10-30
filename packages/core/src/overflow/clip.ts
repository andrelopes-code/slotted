/**
 * The same question `overflow.ts` asks about a scroller, asked about a line of
 * text that cannot be scrolled at all.
 *
 * A column narrowed to `Op…` shows nothing of `Open orders`, and a reader has
 * no gesture that reveals the rest: the box clips, and the words are gone until
 * something else says them. `data-grid` truncates every column name and `table`
 * truncates a cell under `text="truncate"`, so the measurement is written once
 * here rather than three times — `side-navigation` asks it of a row in the rail
 * for the same reason.
 *
 * The arithmetic is `scrollWidth` against `clientWidth`. A clipped inline box
 * lays its text out at full width under the clip and reports the whole of it as
 * its scroll width; a box that fits reports the two within a pixel of each
 * other, which is what the tolerance absorbs.
 */

/** The sub-pixel difference a box that fits still reports. */
export const CLIP_TOLERANCE = 1;

/**
 * Whether the element's own content is cut by its box, along the inline axis.
 *
 * Wider than its box is not the same as hidden: a cell that lets its text spill
 * over the next one still shows every word, and a hint over it would repeat
 * what is already on the screen. The overflow is read first, and only a box
 * that hides what does not fit can cut anything.
 */
export function isClipped(element: Element, tolerance: number = CLIP_TOLERANCE): boolean {
  const view = element.ownerDocument.defaultView;
  const overflow = view?.getComputedStyle(element).overflowX;
  if (overflow === 'visible') return false;
  return element.scrollWidth > element.clientWidth + tolerance;
}
