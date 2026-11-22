/**
 * The geometry of a panel the reader moves over the page: where it starts,
 * where a key moves it, and the clamp that keeps it whole inside the viewport
 * during a move, when the viewport shrinks and when a stored place is
 * restored. A place is the panel's top-left corner in viewport pixels.
 */

export interface FloatingPlace {
  readonly x: number;
  readonly y: number;
}

export interface FloatingSize {
  readonly width: number;
  readonly height: number;
}

/** The corner a panel first opens in, in the reading direction. */
export type FloatingCorner = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** The distance one arrow key moves the panel, and one with Shift. */
export const FLOATING_STEP = 8;
export const FLOATING_LARGE_STEP = 32;

/** The place nearest to `place` at which the whole panel is inside the viewport. */
export function clampPlace(
  place: FloatingPlace,
  size: FloatingSize,
  viewport: FloatingSize,
): FloatingPlace {
  return {
    x: clamp(place.x, 0, viewport.width - size.width),
    y: clamp(place.y, 0, viewport.height - size.height),
  };
}

/** The place of a corner, `inset` pixels from the viewport's edges. */
export function cornerPlace(
  corner: FloatingCorner,
  size: FloatingSize,
  viewport: FloatingSize,
  inset: number,
  direction: 'ltr' | 'rtl' = 'ltr',
): FloatingPlace {
  const [block, inline] = corner.split('-') as ['top' | 'bottom', 'start' | 'end'];
  const atRight = (inline === 'end') === (direction === 'ltr');

  return clampPlace(
    {
      x: atRight ? viewport.width - size.width - inset : inset,
      y: block === 'bottom' ? viewport.height - size.height - inset : inset,
    },
    size,
    viewport,
  );
}

/** Where an arrow key moves the panel, or `null` for any other key. */
export function stepPlace(place: FloatingPlace, key: string, large: boolean): FloatingPlace | null {
  const step = large ? FLOATING_LARGE_STEP : FLOATING_STEP;
  const delta = ARROWS[key];
  if (delta === undefined) return null;

  return { x: place.x + delta[0] * step, y: place.y + delta[1] * step };
}

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
