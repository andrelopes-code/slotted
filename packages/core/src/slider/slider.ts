/**
 * The arithmetic of a track, a scale and one or more thumbs.
 *
 * A slider has to answer four questions, and both bindings have to answer them
 * the same way: where on the scale a pointer landed, which thumb that pointer
 * is asking to move, how far a thumb may go before it meets its neighbour, and
 * what the whole set looks like once one member of it moved.
 *
 * None of it touches the DOM or a framework. The pointer question is asked with
 * a rectangle and a point, not with an event, so it is testable without a
 * browser and identical in React and Angular.
 *
 * Stepping and snapping are `@slotted/core/number`'s, unchanged: a slider and a
 * number field that disagreed about what one step from 4 with a minimum of 2
 * means would be two answers to one question.
 */

import { clamp, roundTo } from '../measure';
import { decimalsOf, snapToStep } from '../number';

export interface Scale {
  min: number;
  max: number;
  step: number;
}

/** A track, as the browser measured it, plus how the document is written. */
export interface TrackGeometry {
  /** The track's box, in client coordinates. */
  rect: { x: number; y: number; width: number; height: number };
  orientation: 'horizontal' | 'vertical';
  /** Whether the inline axis runs right to left. Ignored when vertical. */
  rtl: boolean;
}

/**
 * Where a point sits along the track, from nought at the scale's minimum to one
 * at its maximum.
 *
 * A vertical slider's minimum is at the bottom, which is where every surveyed
 * implementation and the browser's own vertical range input put it, so the
 * block axis is measured from the end rather than from the start. A
 * right-to-left document mirrors the inline axis and leaves the block axis
 * alone: a scale has a direction, and bidi is not it.
 */
export function fractionAtPoint(point: { x: number; y: number }, track: TrackGeometry): number {
  const { orientation, rect, rtl } = track;

  if (orientation === 'vertical') {
    if (rect.height <= 0) return 0;
    return clamp((rect.y + rect.height - point.y) / rect.height, 0, 1);
  }

  if (rect.width <= 0) return 0;
  const fromStart = (point.x - rect.x) / rect.width;
  return clamp(rtl ? 1 - fromStart : fromStart, 0, 1);
}

/**
 * The value at a fraction of the track, snapped to the step grid and rounded to
 * the precision the grid itself is written at.
 *
 * The grid starts at `min`, which is the rule `snapToStep` already states: with
 * a minimum of 2 and a step of 3 the valid values are 2, 5, 8, and a grid that
 * started at nought would make the minimum invalid.
 */
export function valueAtFraction(fraction: number, { min, max, step }: Scale): number {
  const raw = min + clamp(fraction, 0, 1) * (max - min);
  /* A step of nought or less is a continuous scale; six places is where a
     double stops describing a track anyone can point at. */
  if (step <= 0) return roundTo(clamp(raw, min, max), 6);
  return clamp(snapToStep(raw, step, min), min, max);
}

/** One value put on the grid and inside the scale. */
export function normaliseValue(value: number, { min, max, step }: Scale): number {
  if (!Number.isFinite(value)) return min;
  if (step <= 0) return roundTo(clamp(value, min, max), 6);
  return clamp(snapToStep(clamp(value, min, max), step, min), min, max);
}

/** Where a value sits on the track, as a percentage. Nought for an empty scale. */
export function fractionOfValue(value: number, { min, max }: Pick<Scale, 'min' | 'max'>): number {
  const span = max - min;
  if (span <= 0) return 0;
  return clamp(roundTo((value - min) / span, 6), 0, 1);
}

export interface ThumbBoundsRequest extends Scale {
  values: readonly number[];
  index: number;
  /** How many steps must remain between two neighbouring thumbs. */
  minStepsBetween?: number | undefined;
}

/**
 * How far this thumb may move before it meets a neighbour.
 *
 * The bounds are the thumb's own, not the scale's, and they are what the
 * element's `min` and `max` attributes are set to. That is not an
 * implementation convenience: the APG's multi-thumb pattern requires that
 * "the values of aria-valuemin or aria-valuemax of the dependent sliders are
 * updated when the value changes", and an attribute is how a native slider says
 * it. Clamping then belongs to the platform as well.
 */
export function thumbBounds({
  values,
  index,
  min,
  max,
  step,
  minStepsBetween = 0,
}: ThumbBoundsRequest): { min: number; max: number } {
  const gap = Math.max(0, minStepsBetween) * (step > 0 ? step : 0);
  const below = values[index - 1];
  const above = values[index + 1];
  const decimals = Math.max(decimalsOf(step), decimalsOf(min), decimalsOf(max));

  return {
    min: below === undefined ? min : roundTo(Math.max(min, below + gap), decimals),
    max: above === undefined ? max : roundTo(Math.min(max, above - gap), decimals),
  };
}

/**
 * Which thumb a press is asking to move: the nearest one, and on a tie the one
 * that can actually go there.
 *
 * Two thumbs resting on the same value are the case a nearest-only rule gets
 * wrong — both are zero away, and picking the first one leaves a slider whose
 * upper thumb can never leave the bottom of the scale. The tie is broken by
 * direction: a press above the shared value takes the higher index, a press
 * below it takes the lower.
 */
export function nearestThumb(values: readonly number[], target: number): number {
  if (values.length === 0) return -1;

  let nearest = 0;
  let distance = Math.abs(values[0]! - target);

  for (let index = 1; index < values.length; index += 1) {
    const candidate = Math.abs(values[index]! - target);
    if (candidate < distance) {
      nearest = index;
      distance = candidate;
      continue;
    }
    /* Equal distance: the tie goes to the thumb the press is pulling away. */
    if (candidate === distance && target > values[index]!) nearest = index;
  }

  return nearest;
}

export interface MoveRequest extends Scale {
  /**
   * Mutable rather than `readonly`, because the answer is the same array when
   * nothing moved. A caller compares by identity to know it has nothing to
   * emit, and a `readonly` parameter with a mutable answer would make every
   * caller cast the one value the function did not change.
   */
  values: number[];
  index: number;
  next: number;
  minStepsBetween?: number | undefined;
}

/**
 * The whole set after one thumb moved, held inside its own bounds.
 *
 * The array is returned unchanged — the same reference — when nothing moved, so
 * a caller can compare by identity and never emit a request for a value the
 * family already holds.
 */
export function moveThumb({
  values,
  index,
  next,
  min,
  max,
  step,
  minStepsBetween,
}: MoveRequest): number[] {
  const current = values[index];
  if (current === undefined) return values;

  const bounds = thumbBounds({ values, index, min, max, step, minStepsBetween });
  const held = clamp(next, bounds.min, bounds.max);
  if (held === current) return values;

  const moved = values.slice();
  moved[index] = held;
  return moved;
}

/**
 * Every value put on the grid and inside the scale, in ascending order.
 *
 * Order is enforced rather than trusted: a consumer handing `[80, 20]` means a
 * range from 20 to 80, and a family that drew it backwards would paint an
 * indicator of negative length. Sorting is stable at the value level and the
 * thumbs keep their identity because the tab order is the array's order, which
 * is what the multi-thumb pattern requires to stay constant.
 */
export function normaliseValues(values: readonly number[], scale: Scale): number[] {
  return values.map((value) => normaliseValue(value, scale)).sort((a, b) => a - b);
}

/** Whether two value sets are the same, which a `number[]` cannot answer itself. */
export function sameValues(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}
