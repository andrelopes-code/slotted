import { inject, Injectable, InjectionToken } from '@angular/core';
import { RATING_INSIGHT_THRESHOLDS } from '@slotted/core/rating';
import type { RatingInsightThresholds } from '@slotted/core/rating';

/** The step the symbols and the text beside them sit at. */
export type RatingSize = 'sm' | 'md' | 'lg';

/**
 * The colour a lit symbol takes. `secondary` is outside the axis: its solid
 * step is a ground, and a lit star painted in it reads as an unlit one.
 */
export type RatingTone = 'accent' | 'info' | 'success' | 'warning' | 'danger';

/** The smallest move of the input member: a whole symbol, or half of one. */
export type RatingStep = 1 | 0.5;

/** How the display member draws a value: every symbol, one symbol, or one symbol and a histogram. */
export type RatingDisplayVariant = 'full' | 'compact' | 'histogram';

/** How the summary draws a distribution: one bar per level, or columns over the scale with the mean. */
export type RatingSummaryVariant = 'bars' | 'spectrum';

export interface RatingDefaults {
  size: RatingSize;
  tone: RatingTone;
  max: number;
  clearable: boolean;
  insightThresholds: RatingInsightThresholds;
}

/** What `provideRating()` takes: every key optional, and the thresholds partial. */
export type RatingDefaultsInput = Partial<Omit<RatingDefaults, 'insightThresholds'>> & {
  insightThresholds?: Partial<RatingInsightThresholds>;
};

const FALLBACK: RatingDefaults = {
  size: 'md',
  tone: 'warning',
  max: 5,
  clearable: true,
  insightThresholds: RATING_INSIGHT_THRESHOLDS,
};

export const SL_RATING_DEFAULTS = new InjectionToken<RatingDefaults>('slotted rating defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its ratings read — the step, the tone, the
 * scale, whether a press on the chosen star empties it and the thresholds of
 * the summary's conclusion. A threshold left out keeps the family's; an
 * instance that states any of them still wins. The words and the locale come
 * from the language in force (`provideSlotted`).
 */
export function provideRating(defaults: RatingDefaultsInput) {
  return {
    provide: SL_RATING_DEFAULTS,
    useFactory: (): RatingDefaults => ({
      ...FALLBACK,
      ...defaults,
      insightThresholds: { ...RATING_INSIGHT_THRESHOLDS, ...defaults.insightThresholds },
    }),
  };
}

/** What a rating renders as here, before it states anything of its own. */
export function injectRatingDefaults(): RatingDefaults {
  return inject(SL_RATING_DEFAULTS);
}

/**
 * One sequence for every application in the page, not one per application.
 *
 * The generated value is the `name` the radios group by, and grouping is by
 * name across the whole document when there is no form: two applications on
 * one page — every story on a Storybook docs page is its own application —
 * each counting from one gave two ratings the same name, and checking a star
 * in one unchecked the other. `field` scopes its counter to the application
 * because its identifiers must match between server and client; this one is
 * written through an attribute binding, which the client rewrites after
 * hydration, so a sequence shared by the realm costs nothing there.
 */
let sequence = 0;

@Injectable({ providedIn: 'root' })
export class SlRatingIdFactory {
  next() {
    sequence += 1;
    return `slotted-rating-${sequence}`;
  }
}

/** A whole count, with the locale's grouping. */
export function formatCount(count: number, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(count);
}

/** A number written into a custom property, to a fixed number of places. */
export function cssNumber(value: number, places: number): string {
  return String(Number(value.toFixed(places)));
}
