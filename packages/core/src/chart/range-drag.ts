import type { ChartModel } from './model';
import { rangeBetween } from './navigation';
import type { ChartRange } from './types';

/**
 * A drag across the plot, read from the points the engine reports under the
 * pointer. A press starts at the point under it; each new point the pointer
 * reaches while pressed is a range from there; a release that never left the
 * first point is a click, which clears the range.
 */
export interface ChartRangeDrag {
  /** The point under the pointer moved; the range to request while pressed, if it changed. */
  point(model: ChartModel, key: string | null): ChartRange | undefined;
  /** The primary button went down; whether a drag started. */
  press(): boolean;
  /** The button went up; `true` when the press was a click without a drag. */
  release(): boolean;
  cancel(): void;
}

export function createRangeDrag(): ChartRangeDrag {
  let under: string | null = null;
  let anchor: string | null = null;
  let moved = false;

  return {
    point(model, key) {
      if (key === null) return undefined;
      under = key;
      if (anchor === null || (key === anchor && !moved)) return undefined;
      moved = true;
      return rangeBetween(model, anchor, key);
    },
    press() {
      anchor = under;
      moved = false;
      return anchor !== null;
    },
    release() {
      const click = anchor !== null && !moved;
      anchor = null;
      return click;
    },
    cancel() {
      anchor = null;
    },
  };
}
