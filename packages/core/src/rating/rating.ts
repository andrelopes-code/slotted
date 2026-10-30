/**
 * The arithmetic of an ordinal rating: which value a point, a key or a number
 * stands for, how much of each symbol is lit, and what a set of ratings sums
 * to.
 *
 * Both bindings ask the same questions, and none of them touches the DOM. The
 * pointer question is asked with the row's box and a point, not with an event,
 * so a mouse, a pen and a finger dragged along the row are one answer, and it
 * is testable without a browser.
 *
 * A rating has no nought: the first value is one step, and the absence of a
 * rating is `null`. A value of nought would be a sixth option on a five-point
 * scale that nothing draws.
 */

import { clamp, roundTo } from '../measure';

export interface RatingScale {
  /** How many symbols the row has. */
  max: number;
  /** The smallest move: a whole symbol, or half of one. */
  step: 1 | 0.5;
}

export interface RatingKeyOptions {
  /** Whether the inline axis runs right to left. */
  rtl: boolean;
  /** Whether Backspace and Delete may empty the value. */
  clearable: boolean;
}

/** One level of a distribution, highest first, as a summary draws it. */
export interface RatingLevel {
  level: number;
  count: number;
  /** The level's share of the total, from nought to one. */
  share: number;
}

/** Negative is the lower two levels of five, neutral the middle, positive the upper two. */
export interface RatingBuckets {
  negative: number;
  neutral: number;
  positive: number;
}

/**
 * The one conclusion a summary may draw, the first that holds: the readings are
 * split between the two ends; there are too few to trust the mean; the
 * readings agree; or none of those.
 */
export type RatingInsight = 'divided' | 'few' | 'consensus' | 'mixed';

/** Where the conclusions are drawn. Each is a share from nought to one, or a count. */
export interface RatingInsightThresholds {
  /** Both ends at least this share: `divided`. */
  divided: number;
  /** Fewer readings than this, or a margin at least `margin`: `few`. */
  few: number;
  margin: number;
  /** The positive share at least this: `consensus`. */
  consensus: number;
}

export const RATING_INSIGHT_THRESHOLDS: RatingInsightThresholds = {
  divided: 0.25,
  few: 30,
  margin: 0.5,
  consensus: 0.8,
};

export interface RatingSummary {
  total: number;
  /** The mean to one place, or `null` when nothing has been rated. */
  average: number | null;
  levels: RatingLevel[];
  /** The mean unrounded, for placing it on an axis. */
  mean: number | null;
  /** The population standard deviation. */
  deviation: number | null;
  /** Half the 95% interval of the mean, by the normal approximation. */
  margin: number | null;
  /** The 95% interval of the mean, clamped to the scale. */
  interval: [number, number] | null;
  buckets: RatingBuckets;
  insight: RatingInsight | null;
}

/**
 * A value put on the grid of the scale, or `null` for no rating.
 *
 * A value between two steps is rounded up: 3.2 on a whole scale is four,
 * because the reader who is past three has reached into the fourth symbol.
 */
export function normalizeRating(
  value: number | null | undefined,
  { max, step }: RatingScale,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return clamp(roundTo(Math.ceil(roundTo(value / step, 6)) * step, 6), step, max);
}

/**
 * The value under a point on the row of symbols.
 *
 * The row is `max` equal symbols, so the fraction of the row the point has
 * crossed, times `max`, is how many symbols it has reached into; rounded up to
 * the step, it is the value a press there asks for. A point before the row
 * reads the first step and a point past it reads the maximum, so a finger that
 * slides off either end keeps the end it slid off.
 */
export function ratingAtPoint(
  point: { x: number },
  row: { x: number; width: number },
  scale: RatingScale,
  rtl = false,
): number {
  if (row.width <= 0) return scale.step;
  const fromStart = clamp((point.x - row.x) / row.width, 0, 1);
  const fraction = rtl ? 1 - fromStart : fromStart;
  return normalizeRating(Math.max(fraction * scale.max, Number.EPSILON), scale) ?? scale.step;
}

/**
 * The value a key asks for, `null` when it empties the value, or `undefined`
 * when the key is not the family's — Tab and Space stay the platform's.
 *
 * The arrows stop at both ends rather than wrapping: a rating that falls from
 * five to one on one keystroke too many is the defect the slider example of
 * the APG, Ark, MUI and Mantine all avoid. The inline arrows follow the
 * direction the document is written in; the block arrows do not, because up
 * is more in every script.
 */
export function ratingForKey(
  key: string,
  current: number | null,
  scale: RatingScale,
  { rtl, clearable }: RatingKeyOptions,
): number | null | undefined {
  const { max, step } = scale;
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

  switch (key) {
    case forward:
    case 'ArrowUp':
      return current === null ? step : clamp(roundTo(current + step, 6), step, max);
    case backward:
    case 'ArrowDown':
      return current === null ? step : clamp(roundTo(current - step, 6), step, max);
    case 'Home':
      return step;
    case 'End':
      return max;
    case 'Backspace':
    case 'Delete':
      return clearable ? null : undefined;
    default:
      return undefined;
  }
}

/** How much of each symbol is lit, from nought to one, first symbol first. */
export function ratingFills(value: number | null, max: number): number[] {
  const lit = value === null || !Number.isFinite(value) ? 0 : value;
  return Array.from({ length: max }, (_, index) => roundTo(clamp(lit - index, 0, 1), 6));
}

/**
 * A distribution read from counts per level, lowest level first — the order a
 * store holds them in — and returned highest first, the order every surveyed
 * summary draws them in.
 *
 * A count that is negative or fractional is not a count of people, and it is
 * dropped to its whole non-negative part rather than trusted.
 */
export function summarizeRatings(
  countsByLevel: readonly number[],
  thresholds: Partial<RatingInsightThresholds> = {},
): RatingSummary {
  const rules = { ...RATING_INSIGHT_THRESHOLDS, ...thresholds };
  const counts = countsByLevel.map((count) =>
    Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0,
  );
  const max = counts.length;
  const total = counts.reduce((sum, count) => sum + count, 0);
  const levels = counts
    .map((count, index) => ({
      level: index + 1,
      count,
      share: total === 0 ? 0 : roundTo(count / total, 6),
    }))
    .reverse();

  if (total === 0) {
    return {
      total,
      average: null,
      levels,
      mean: null,
      deviation: null,
      margin: null,
      interval: null,
      buckets: { negative: 0, neutral: 0, positive: 0 },
      insight: null,
    };
  }

  const mean = counts.reduce((sum, count, index) => sum + count * (index + 1), 0) / total;
  const square = counts.reduce((sum, count, index) => sum + count * (index + 1) ** 2, 0) / total;
  const deviation = Math.sqrt(Math.max(0, square - mean * mean));
  const margin = (1.96 * deviation) / Math.sqrt(total);
  /* The lower two levels and the upper two, on a scale of five; the middle
     level is what an even scale does not have, and it is then empty. */
  const side = Math.floor(max * 0.4);
  const share = (from: number, to: number) =>
    roundTo(counts.slice(from, to).reduce((sum, count) => sum + count, 0) / total, 6);
  const buckets = {
    negative: share(0, side),
    neutral: share(side, max - side),
    positive: share(max - side, max),
  };

  let insight: RatingInsight = 'mixed';
  if (buckets.negative >= rules.divided && buckets.positive >= rules.divided) insight = 'divided';
  else if (total < rules.few || margin >= rules.margin) insight = 'few';
  else if (buckets.positive >= rules.consensus) insight = 'consensus';

  return {
    total,
    average: roundTo(mean, 1),
    levels,
    mean: roundTo(mean, 6),
    deviation: roundTo(deviation, 6),
    margin: roundTo(margin, 6),
    interval: [roundTo(clamp(mean - margin, 1, max), 6), roundTo(clamp(mean + margin, 1, max), 6)],
    buckets,
    insight,
  };
}

/** A value as a summary prints it: always one place, in the locale's digits. */
export function formatRating(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * A value as a label reads it: to one place at most, in the locale's digits. A
 * whole value is written whole — "3", not "3,0" — because a label is read
 * aloud. The bindings hand it to the catalog's `{value}` already written.
 */
export function formatRatingValue(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

/** A share from nought to one as a whole percentage, a half rounded away from nought. */
export function formatShare(share: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
    share,
  );
}
