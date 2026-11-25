import {
  createTimeFormat,
  dayPeriod,
  durationLabel,
  isSameTime,
  refusalOfTimes,
  shortTimeRun,
  timeRangeSeconds,
} from '@slotted/core/date';
import type { PlainTime, TimeFormat, TimeGranularity, TimeRunRules } from '@slotted/core/date';
import type {
  ClockMessages,
  FamilyTranslator,
  PickerPanelMessages,
  TimeRangePickerMessages,
} from '@slotted/core/i18n';

import type { TimeRange, TimeRangePickerDefaults } from './time-range-picker-defaults';

/** What a run of times is written with. */
export interface TimeRangeWords {
  readonly clock: FamilyTranslator<ClockMessages>;
  readonly granularity: TimeGranularity;
  readonly hourCycle?: 12 | 24 | undefined;
  readonly lengthLabel: TimeRangePickerDefaults['lengthLabel'];
  readonly locale: string;
  readonly rules: TimeRunRules;
  readonly t: FamilyTranslator<TimeRangePickerMessages>;
  readonly words: FamilyTranslator<PickerPanelMessages>;
}

/** The names of the four parts of the day, in the order `dayPeriod` counts them. */
const PERIODS = ['night', 'morning', 'afternoon', 'evening'] as const;

/** The one word for nothing: a value whose both ends are `null` is `null`. */
export function normalizeTimes(range: TimeRange | null): TimeRange | null {
  return range === null || (range.start === null && range.end === null) ? null : range;
}

export function isSameTimeRange(a: TimeRange | null, b: TimeRange | null): boolean {
  if (a === null || b === null) return a === b;

  return isSameTime(a.start, b.start) && isSameTime(a.end, b.end);
}

export function timeFormatOf(words: TimeRangeWords): TimeFormat {
  return createTimeFormat(words);
}

/** One end of a run: its time, and the part of the day it is in. */
export function timeEndWords(time: PlainTime | null, words: TimeRangeWords) {
  if (time === null) return { empty: true, meta: '', text: '–' };

  return {
    empty: false,
    meta: words.clock(PERIODS[dayPeriod(time.hour)]).toLocaleLowerCase(words.locale),
    text: timeFormatOf(words).format(time),
  };
}

/** "2 hr 45 min": the length of a whole run in order, and of nothing otherwise. */
export function timeSpanWords(run: TimeRange | null, words: TimeRangeWords): string {
  const seconds = run?.start && run.end ? timeRangeSeconds(run.start, run.end) : 0;

  return words.lengthLabel(Math.max(0, seconds), words.locale);
}

/** "30 min to 4 hr", "at least 30 min", "at most 4 hr"; the step without a limit. */
export function timeLimitWords({ lengthLabel, locale, rules, t, words }: TimeRangeWords): string {
  const { maxLength, minLength, options, step } = rules;
  const write = (seconds: number) => lengthLabel(seconds, locale);

  if (minLength !== undefined && maxLength !== undefined) {
    return t('limit.between', { min: write(minLength), max: write(maxLength) });
  }
  if (minLength !== undefined) return t('limit.atLeast', { min: write(minLength) });
  if (maxLength !== undefined) return t('limit.atMost', { max: write(maxLength) });

  return options === undefined
    ? words('every', { length: durationLabel(step, locale, 'second') })
    : '';
}

/** Why a run is refused, in words; `null` for one that is taken. */
export function timeRefusalWords(run: TimeRange | null, words: TimeRangeWords): string | null {
  const refusal = refusalOfTimes(run, words.rules);
  if (refusal === null) return null;
  if (refusal.reason === 'over' || refusal.reason === 'short') {
    return words.words(refusal.reason, { length: words.lengthLabel(refusal.by, words.locale) });
  }

  return words.t(refusal.reason);
}

/** What a shortcut writes: its two ends, the parts they share written once. */
export function timeResultWords({ end, start }: TimeRange, words: TimeRangeWords): string {
  return start === null || end === null ? '' : shortTimeRun(start, end, words.locale, words);
}

/** The value in the frame; `null` while there is none. */
export function timeSummary(held: TimeRange | null, words: TimeRangeWords): string | null {
  if (held === null) return null;

  const format = timeFormatOf(words);
  const [start, end] = [held.start, held.end].map((time) => time && format.format(time));

  return `${start ?? ''} – ${end ?? ''}`.trim();
}

/** The trigger's name: focus returns there, so it carries both ends and the length. */
export function timeTriggerName(held: TimeRange | null, words: TimeRangeWords): string {
  if (!held?.start || !held.end) return words.t('choose');

  const format = timeFormatOf(words);
  const ends = { start: format.describe(held.start), end: format.describe(held.end) };

  return timeRangeSeconds(held.start, held.end) < 0
    ? words.t('changeReversed', ends)
    : words.t('change', { ...ends, length: timeSpanWords(held, words) });
}
