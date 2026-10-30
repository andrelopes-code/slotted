import { sheetStops } from './extent';

/**
 * What a resize gesture does to the document while the pointer is down, and
 * undoes when it comes up.
 *
 * Two things, and neither belongs to the family's own stylesheet. The cursor
 * has to survive the pointer leaving the separator — pointer capture keeps the
 * events coming and the cursor is decided by whatever is under the pointer, so
 * a drag that reached the page beside the panel showed a text caret over it.
 * And a drag across text selects it, which is what `user-select` on the
 * document answers; a rule on the family would only cover the family's own box.
 *
 * The previous inline values are put back rather than cleared, so a consumer
 * who had set either keeps it. This is the one file in `@slotted/core/extent`
 * that touches the DOM; the arithmetic beside it touches none.
 */

export type ResizeCursor = 'col-resize' | 'row-resize';

/**
 * Holds the cursor and suspends selection for the life of a drag. Returns the
 * function that puts both back, which is safe to call more than once.
 */
export function holdResizeGesture(
  document: Document | null | undefined,
  cursor: ResizeCursor,
): () => void {
  const body = document?.body;
  const root = document?.documentElement;
  if (body === undefined || body === null || root === undefined || root === null) {
    return () => undefined;
  }

  const priorCursor = body.style.cursor;
  const priorSelect = root.style.userSelect;
  body.style.cursor = cursor;
  root.style.userSelect = 'none';

  let released = false;
  return () => {
    if (released) return;
    released = true;
    body.style.cursor = priorCursor;
    root.style.userSelect = priorSelect;
  };
}

/**
 * A CSS length in pixels, resolved where it will be used.
 *
 * `18rem`, `200px`, `25%` and `10vw` are all limits a consumer may reasonably
 * write, and only the browser knows what any of them come to: `rem` against the
 * root, `em` against the element the probe is placed in, percentages against
 * `basis` — the length they are a percentage of — when it is given. So the
 * probe is placed in that element rather than in the document, and every unit
 * resolves the way the consumer's own stylesheet would resolve it.
 *
 * It is a measurement and not a parse for the same reason `positioner` measures
 * rather than computes: a parser here would be a second, worse implementation
 * of the CSS value grammar, and it would be wrong first for the unit nobody
 * thought of.
 *
 * The probe is removed before the value is returned, and it is out of flow and
 * invisible while it is there, so nothing the consumer can see moves.
 */
export function measureLength(value: string, against: HTMLElement, basis?: number): number {
  const document = against.ownerDocument;
  const probe = document.createElement('div');
  probe.style.inlineSize = value;

  /*
   * A probe out of flow resolves a percentage against its containing block —
   * the nearest positioned ancestor, not the element it stands in. Given the
   * length a percentage is of, the probe stands in flow inside a box of that
   * length, so "25%" and "calc(100% - 36rem)" are of the basis; the box takes
   * the font of the element it is put in, so `em` still resolves there.
   */
  let outer = probe;
  if (basis !== undefined) {
    outer = document.createElement('div');
    outer.style.inlineSize = `${basis}px`;
    outer.style.blockSize = '0';
    outer.append(probe);
  }
  outer.style.position = 'absolute';
  outer.style.visibility = 'hidden';
  outer.style.pointerEvents = 'none';

  against.append(outer);
  const pixels = probe.getBoundingClientRect().width;
  outer.remove();

  return pixels;
}

/**
 * How tall a panel would be if it measured its content, whatever it measures
 * now: its own height, less the scrolling row's box, plus everything that row
 * holds. It is the content stop of a sheet, read when a gesture or a key needs
 * it rather than kept, because content changes while a sheet is open.
 */
export function contentLength(panel: HTMLElement, body: HTMLElement | null): number {
  if (body === null) return panel.scrollHeight;
  return panel.offsetHeight - body.clientHeight + body.scrollHeight;
}

/** Two fractions a rounding apart are the same stop. */
const SAME_STOP = 0.002;

/**
 * The stops a sheet rests on and its rest among them, measured now.
 *
 * Under `content` the rest is the height of what the panel holds, capped where
 * the stylesheet caps it — `reserve` short of the layer, a length the caller
 * reads from its own stylesheet. Otherwise the rest is what the panel measures
 * while nothing has moved it, and `rest` is the last such measurement.
 */
export function measureSheetStops({
  atRest,
  content,
  panel,
  reserve,
  rest,
  snapPoints,
  span,
}: {
  readonly atRest: boolean;
  readonly content: boolean;
  readonly panel: HTMLElement;
  readonly reserve: string;
  readonly rest: number | undefined;
  readonly snapPoints: readonly number[];
  readonly span: number;
}): { rest: number | undefined; stops: number[] } {
  if (span <= 0) return { rest: undefined, stops: [] };
  let measured = rest;
  if (content) {
    const body = panel.querySelector<HTMLElement>(':scope > [data-part="body"]');
    const cap = span - measureLength(reserve, panel);
    measured = Math.min(contentLength(panel, body), cap) / span;
  } else if (atRest) {
    measured = panel.offsetHeight / span;
  }
  return {
    rest: measured,
    stops: sheetStops({ rest: measured, restIsStop: content, snapPoints }),
  };
}

/**
 * What a settled fraction is asked as. The content stop is `undefined`, so the
 * sheet follows its content again when the content grows.
 */
export function stopAsExtent(
  fraction: number,
  rest: number | undefined,
  content: boolean,
): number | undefined {
  return content && rest !== undefined && Math.abs(fraction - rest) < SAME_STOP
    ? undefined
    : fraction;
}

/** Whether two fractions name the same stop. */
export function sameStop(a: number, b: number): boolean {
  return Math.abs(a - b) < SAME_STOP;
}
