/**
 * Widgets that change place glide there. The grid places them with CSS, which
 * cannot interpolate a placement, so the move is measured before and after the
 * change and the difference is played back as a transform: the FLIP technique.
 * The duration is the theme's `--slotted-duration-medium`, which the reduced
 * motion query collapses to one millisecond, so the motion scale decides both.
 */

export interface MeasuredTile {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function measureTiles(elements: ReadonlyMap<string, Element>): Map<string, MeasuredTile> {
  const measured = new Map<string, MeasuredTile>();
  for (const [key, element] of elements) {
    const { left, top, width, height } = element.getBoundingClientRect();
    measured.set(key, { left, top, width, height });
  }
  return measured;
}

/** A CSS time — `200ms` or `0.2s` — in milliseconds; 0 when it is neither. */
export function parseDuration(value: string): number {
  const text = value.trim();
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number)) return 0;
  if (text.endsWith('ms')) return number;
  if (text.endsWith('s')) return number * 1000;
  return 0;
}

export interface PlayFlipOptions {
  /** Milliseconds; below 2 nothing is played. */
  readonly duration: number;
  readonly easing: string;
}

/**
 * Plays each element from where it was to where it is. An element whose box
 * did not move, or that was not measured before, is left alone.
 */
export function playFlip(
  elements: ReadonlyMap<string, HTMLElement>,
  before: ReadonlyMap<string, MeasuredTile>,
  { duration, easing }: PlayFlipOptions,
): void {
  if (duration < 2) return;
  for (const [key, element] of elements) {
    const was = before.get(key);
    if (was === undefined || typeof element.animate !== 'function') continue;
    const now = element.getBoundingClientRect();
    const dx = was.left - now.left;
    const dy = was.top - now.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    element.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
      { duration, easing },
    );
  }
}

/**
 * A widget let go at the size a pointer pulled it to settles into its cells:
 * its box is played from where the pointer left it to where the grid put it.
 * Width and height are animated rather than scaled, so the content reflows
 * instead of stretching.
 */
export function playResize(
  element: HTMLElement,
  from: MeasuredTile,
  { duration, easing }: PlayFlipOptions,
): void {
  if (duration < 2 || typeof element.animate !== 'function') return;
  const now = element.getBoundingClientRect();
  const dx = from.left - now.left;
  const dy = from.top - now.top;
  element.animate(
    [
      {
        width: `${from.width}px`,
        height: `${from.height}px`,
        transform: `translate(${dx}px, ${dy}px)`,
      },
      { width: `${now.width}px`, height: `${now.height}px`, transform: 'translate(0, 0)' },
    ],
    { duration, easing },
  );
}
