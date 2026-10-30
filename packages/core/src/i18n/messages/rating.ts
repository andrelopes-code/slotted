import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * Every word `rating` writes on its own. `{value}` arrives already written, to
 * one place at most ("3", "3.5"), because the scale is read in tenths and the
 * grammar's own number would print three; `{share}`, `{margin}`, `{low}` and
 * `{high}` arrive written for the same reason.
 */
export interface RatingMessages {
  readonly consensus: Message;
  readonly displayLabel: Message<{ value: string; max: number }>;
  readonly displayLabelWithCount: Message<{ value: string; max: number; count: number }>;
  readonly distributionLabel: Message;
  readonly divided: Message;
  readonly few: Message;
  readonly itemLabel: Message<{ value: string; max: number }>;
  readonly levelLabel: Message<{ level: number; count: number; share: string }>;
  readonly mixed: Message;
  readonly negative: Message<{ share: string }>;
  readonly neutral: Message<{ share: string }>;
  readonly positive: Message<{ share: string }>;
  readonly scale: Message<{ max: number }>;
  readonly spectrumCount: Message<{ count: number; margin: string }>;
  readonly spectrumUncertain: Message<{ count: number; low: string; high: string }>;
  readonly summaryCount: Message<{ count: number }>;
  readonly summaryEmpty: Message;
}

export const en: RatingMessages = {
  consensus: 'Strong consensus',
  displayLabel: 'Rated {value} out of {max}',
  displayLabelWithCount:
    'Rated {value} out of {max}, {count, plural, one {# rating} other {# ratings}}',
  distributionLabel: 'Distribution by stars',
  divided: 'Divided opinions',
  few: 'Few ratings',
  itemLabel: '{value} out of {max}',
  levelLabel:
    '{level, plural, one {# star} other {# stars}}: {count, plural, one {# rating} other {# ratings}}, {share}',
  mixed: 'Mixed opinions',
  negative: '{share} negative',
  neutral: '{share} neutral',
  positive: '{share} positive',
  scale: 'out of {max}',
  spectrumCount: '{count, plural, one {# rating} other {# ratings}} · margin of ± {margin}',
  spectrumUncertain:
    '{count, plural, one {# rating} other {# ratings}} · uncertain average, between {low} and {high}',
  summaryCount: 'Based on {count, plural, one {# rating} other {# ratings}}',
  summaryEmpty: 'No ratings yet',
};

export const ratingMessages: MessageFamily<'rating', RatingMessages> = { name: 'rating', base: en };
