/**
 * The arithmetic a paginator runs on, resolved once for both bindings.
 *
 * Four questions, and every surveyed implementation answers all four inside
 * its own framework: how many pages a count makes, where a page goes when the
 * collection shrinks under it, which numbers and ellipses the row draws, and
 * which items the current page covers. Two copies of the ellipsis rule that
 * must agree item for item is one copy too many — a React paginator and an
 * Angular paginator that disagree about when the left ellipsis appears are two
 * different components wearing one name.
 *
 * Nothing here touches the DOM or a framework. It is arithmetic.
 */

export interface PageCount {
  /** How many items the collection holds. Never negative. */
  count: number;
  /** How many items one page holds. Never below one. */
  pageSize: number;
}

export interface PageRange extends PageCount {
  /** The page being read, one-based. */
  page: number;
}

export interface PageItemsInput extends PageRange {
  /** Pages drawn either side of the current one. Defaults to one. */
  siblingCount?: number | undefined;
  /** Pages drawn at each end of the row. Defaults to one. */
  boundaryCount?: number | undefined;
}

export type PageItem =
  | { readonly type: 'page'; readonly value: number }
  | { readonly type: 'ellipsis'; readonly side: 'start' | 'end' };

export interface ItemRange {
  /** The first item on the page, one-based. Nought when there are none. */
  start: number;
  /** The last item on the page, one-based and inclusive. Nought when there are none. */
  end: number;
}

const atLeast = (value: number, floor: number) =>
  Number.isFinite(value) ? Math.max(floor, Math.trunc(value)) : floor;

/**
 * An empty collection is one page, not nought. A paginator that reported nought
 * pages would have no page to be on, and every clamp below it would resolve to
 * a page number the row cannot draw.
 */
export function totalPages({ count, pageSize }: PageCount): number {
  return Math.max(1, Math.ceil(atLeast(count, 0) / atLeast(pageSize, 1)));
}

/** Where a page number lands once the collection is the size it actually is. */
export function clampPage(page: number, total: number): number {
  const last = Math.max(1, Math.trunc(total));
  if (!Number.isFinite(page)) return 1;
  return Math.min(last, Math.max(1, Math.trunc(page)));
}

/**
 * The one-based inclusive range the current page covers, which is what "21–40
 * of 482" is made of. An empty collection yields nought to nought rather than
 * one to nought, so a caller can test either end.
 */
export function itemRange(input: PageRange): ItemRange {
  const count = atLeast(input.count, 0);
  if (count === 0) return { start: 0, end: 0 };

  const pageSize = atLeast(input.pageSize, 1);
  const page = clampPage(input.page, totalPages({ count, pageSize }));
  const start = (page - 1) * pageSize + 1;

  return { start, end: Math.min(count, page * pageSize) };
}

/**
 * The row of numbers, with an ellipsis wherever a run was skipped.
 *
 * The row's length is constant at every page, which is what stops the
 * paginator from changing width as the reader walks through it: with the
 * default counts it is boundary, ellipsis, sibling, page, sibling, ellipsis,
 * boundary — seven items. At either end, where one gap has nothing to hide,
 * the item it would have occupied is spent on another neighbour rather than
 * left empty.
 *
 * An ellipsis is never drawn in place of a single page. Zag, MUI and Primer all
 * take this decision and all three take it the same way: replacing page four
 * with "…" costs the reader a target and saves nothing.
 */
export function pageItems(input: PageItemsInput): PageItem[] {
  const count = atLeast(input.count, 0);
  const pageSize = atLeast(input.pageSize, 1);
  const total = totalPages({ count, pageSize });
  const page = clampPage(input.page, total);
  const siblings = atLeast(input.siblingCount ?? 1, 0);
  const boundary = atLeast(input.boundaryCount ?? 1, 1);

  const numbers = (from: number, to: number) =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);

  /* Boundary, gap, siblings, page, siblings, gap, boundary. Below that the row
     holds every page and no gap can be worth drawing. */
  const shortest = boundary * 2 + siblings * 2 + 5;
  if (total <= shortest) {
    return numbers(1, total).map((value) => ({ type: 'page', value }) as const);
  }

  const start = numbers(1, boundary);
  const end = numbers(total - boundary + 1, total);
  const middleStart = Math.max(
    Math.min(page - siblings, total - boundary - siblings * 2 - 1),
    boundary + 2,
  );
  const middleEnd = Math.min(
    Math.max(page + siblings, boundary + siblings * 2 + 2),
    total - boundary - 1,
  );

  const items: PageItem[] = start.map((value) => ({ type: 'page', value }) as const);

  if (middleStart > boundary + 2) items.push({ type: 'ellipsis', side: 'start' });
  else if (boundary + 1 < middleStart) items.push({ type: 'page', value: boundary + 1 });

  for (const value of numbers(middleStart, middleEnd)) items.push({ type: 'page', value });

  if (middleEnd < total - boundary - 1) items.push({ type: 'ellipsis', side: 'end' });
  else if (middleEnd + 1 < total - boundary + 1) {
    items.push({ type: 'page', value: total - boundary });
  }

  return [...items, ...end.map((value) => ({ type: 'page', value }) as const)];
}
