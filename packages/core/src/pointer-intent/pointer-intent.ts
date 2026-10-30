/**
 * Whether the pointer is still travelling toward a rectangle.
 *
 * A submenu opens to the side of the item that owns it, and the pointer
 * reaching it travels diagonally across the items in between. A submenu that
 * closed the moment the pointer left its parent item would close under the
 * reader's hand every time, so every serious implementation grants a grace: the
 * submenu stays open while the pointer's own path still points into it.
 *
 * `docs/component-features.md` §8 asks for the grace area by name — "Submenu
 * possui intent/grace area" — and no module in `packages/core` held it.
 * `preview-card` in wave 8 asks the same question of a hover card.
 *
 * The geometry is a triangle rather than a rectangle, and that is the whole
 * idea: from where the pointer was, the two near corners of the target span a
 * cone. Inside it, the pointer is heading there whatever it happens to be over;
 * outside it, the reader has changed their mind.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Milliseconds a grace survives with no movement at all. */
export const DEFAULT_INTENT_TIMEOUT = 300;

const contains = (rect: Rect, point: Point) =>
  point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

const cross = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/**
 * The two corners of the edge that faces a point: the near edge is the one the
 * pointer would cross first. A target to the inline end of the pointer is
 * entered through its start edge; one below is entered through its top.
 */
function nearEdge(rect: Rect, from: Point): [Point, Point] {
  if (from.x < rect.left) {
    return [
      { x: rect.left, y: rect.top },
      { x: rect.left, y: rect.bottom },
    ];
  }
  if (from.x > rect.right) {
    return [
      { x: rect.right, y: rect.top },
      { x: rect.right, y: rect.bottom },
    ];
  }
  if (from.y < rect.top) {
    return [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
    ];
  }
  return [
    { x: rect.left, y: rect.bottom },
    { x: rect.right, y: rect.bottom },
  ];
}

/**
 * Whether `current` lies in the cone spanned by `previous` and the near edge of
 * `rect`. A point inside the rectangle is heading there by definition, and a
 * pointer that has not moved keeps whatever answer it had.
 */
export function headingTo(previous: Point, current: Point, rect: Rect): boolean {
  if (contains(rect, current)) return true;

  const [first, second] = nearEdge(rect, previous);
  const signs = [
    cross(previous, first, current),
    cross(first, second, current),
    cross(second, previous, current),
  ];

  return signs.every((sign) => sign >= 0) || signs.every((sign) => sign <= 0);
}

export interface PointerIntentOptions {
  /** The rectangle the pointer may be travelling to, read at each move. */
  target: () => Rect | null;
  /**
   * The rectangle the journey starts from — the parent item. While the pointer
   * is still on it, nothing has been left and the grace holds.
   */
  origin?: () => Rect | null;
  /** How long a grace survives with no movement at all. */
  timeout?: number;
  /** The pointer is no longer heading for the target. */
  onSettled: () => void;
  /** The document to listen on. Defaults to the ambient one. */
  document?: Document;
}

export interface PointerIntentHandle {
  /** Ends the grace now, as a submenu closing for another reason does. */
  cancel: () => void;
  destroy: () => void;
}

export function createPointerIntent(options: PointerIntentOptions): PointerIntentHandle {
  const timeout = options.timeout ?? DEFAULT_INTENT_TIMEOUT;
  const doc = options.document ?? globalThis.document;

  let previous: Point | null = null;
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const settle = () => {
    if (settled) return;
    settled = true;
    stop();
    options.onSettled();
  };

  /**
   * A pointer parked on another item sends no more events, so the moves alone
   * would leave the submenu open for as long as the reader looked away. The
   * timer is what ends a grace nobody is spending.
   */
  const wait = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(settle, timeout);
  };

  const onMove = (event: Event) => {
    const { clientX, clientY } = event as MouseEvent;
    const current = { x: clientX, y: clientY };
    const from = previous ?? current;
    previous = current;

    const origin = options.origin?.() ?? null;
    if (origin && contains(origin, current)) {
      wait();
      return;
    }

    const target = options.target();
    if (!target) return settle();
    if (!headingTo(from, current, target)) return settle();

    wait();
  };

  function stop() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    doc?.removeEventListener('pointermove', onMove);
  }

  doc?.addEventListener('pointermove', onMove);
  wait();

  return {
    cancel: settle,
    destroy: stop,
  };
}
