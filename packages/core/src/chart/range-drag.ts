import type { ChartModel } from './model';
import { rangeBetween } from './navigation';
import type { ChartRange } from './types';

/**
 * A drag across the plot, read from the points the engine reports under the
 * pointer. A press starts at the point under it; each new point the pointer
 * reaches while pressed is a range from there; a release that never left the
 * first point is a click, which clears the range. A finger has no point under
 * it before it lands, so its press starts at the first point reported after it.
 */
export interface ChartRangeDrag {
  /** The point under the pointer moved; the range to request while pressed, if it changed. */
  point(model: ChartModel, key: string | null): ChartRange | undefined;
  /** The primary button, or a finger, went down; whether a drag started. */
  press(touch?: boolean): boolean;
  /** The button went up; `true` when the press was a click without a drag. */
  release(): boolean;
  cancel(): void;
}

export function createRangeDrag(): ChartRangeDrag {
  let under: string | null = null;
  let anchor: string | null = null;
  let pressed = false;
  let moved = false;

  return {
    point(model, key) {
      if (key === null) return undefined;
      under = key;
      if (!pressed) return undefined;
      anchor ??= key;
      if (key === anchor && !moved) return undefined;

      moved = true;

      return rangeBetween(model, anchor, key);
    },
    press(touch = false) {
      anchor = touch ? null : under;
      pressed = touch || anchor !== null;
      moved = false;

      return pressed;
    },
    release() {
      const click = pressed && !moved;
      pressed = false;

      return click;
    },
    cancel() {
      pressed = false;
    },
  };
}
