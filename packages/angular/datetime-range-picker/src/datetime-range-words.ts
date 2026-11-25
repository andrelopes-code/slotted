import {
  createDateTimeFormat,
  createTimeFormat,
  dateTimeRangeSeconds,
  daysBetween,
  durationLabel,
  isSameDateTime,
  momentOf,
  momentRunOf,
  refusalOfMoments,
  SECONDS_PER_DAY,
  shortDay,
  shortMoment,
  shortRun,
  weekdayMeta,
} from '@slotted/core/date';
import type {
  MomentDraft,
  MomentRunDraft,
  MomentRunRules,
  PlainDate,
  TimeGranularity,
} from '@slotted/core/date';
import type {
  DatetimeRangePickerMessages,
  FamilyTranslator,
  PickerPanelMessages,
} from '@slotted/core/i18n';

import type { DateTimeRange, DateTimeRangePickerDefaults } from './datetime-range-picker-defaults';

/** What a run of moments is written with. */
export interface DateTimeRangeWords {
  readonly granularity: TimeGranularity;
  readonly hourCycle?: 12 | 24 | undefined;
  readonly lengthLabel: DateTimeRangePickerDefaults['lengthLabel'];
  readonly locale: string;
  readonly rules: MomentRunRules;
  readonly t: FamilyTranslator<DatetimeRangePickerMessages>;
  readonly timeZone: string | undefined;
  readonly today: PlainDate;
  readonly words: FamilyTranslator<PickerPanelMessages>;
}

/** The one word for nothing: a value whose both ends are `null` is `null`. */
export function normalizeMoments(range: DateTimeRange | null): DateTimeRange | null {
  return range === null || (range.start === null && range.end === null) ? null : range;
}

export function isSameDateTimeRange(a: DateTimeRange | null, b: DateTimeRange | null): boolean {
  if (a === null || b === null) return a === b;

  return isSameDateTime(a.start, b.start) && isSameDateTime(a.end, b.end);
}

/** One end of a run: its day and its time, and how far it is. */
export function momentEndWords({ date, time }: MomentDraft, words: DateTimeRangeWords) {
  const { locale, today, words: t } = words;

  return {
    day: date === null ? t('chooseDay') : shortDay(date, locale),
    empty: date === null || time === null,
    meta: date === null ? '' : weekdayMeta(date, today, locale, t),
    time: time === null ? t('time') : createTimeFormat(words).format(time),
  };
}

/** The length of a run: to the second once it is whole, in days before. */
export function momentSpanSeconds(draft: MomentRunDraft): number {
  const start = momentOf(draft.start);
  const end = momentOf(draft.end);
  if (start !== null && end !== null) return Math.max(0, dateTimeRangeSeconds(start, end));
  if (draft.start.date === null || draft.end.date === null) return 0;

  return Math.max(0, daysBetween(draft.start.date, draft.end.date)) * SECONDS_PER_DAY;
}

/** "1 day to 7 days", "at least 1 day"; the zone, or the step, without a limit. */
export function momentLimitWords(words: DateTimeRangeWords): string {
  const { lengthLabel, locale, rules, t, timeZone } = words;
  const { maxLength, minLength, options, step } = rules;
  const write = (seconds: number) => lengthLabel(seconds, locale);

  if (minLength !== undefined && maxLength !== undefined) {
    return t('limit.between', { min: write(minLength), max: write(maxLength) });
  }
  if (minLength !== undefined) return t('limit.atLeast', { min: write(minLength) });
  if (maxLength !== undefined) return t('limit.atMost', { max: write(maxLength) });
  if (timeZone !== undefined) return timeZone;

  return options === undefined
    ? words.words('every', { length: durationLabel(step, locale, 'second') })
    : '';
}

/** Why a run is refused, in words; `null` for one that is taken. */
export function momentRefusalWords(
  run: DateTimeRange | null,
  words: DateTimeRangeWords,
): string | null {
  const refusal = refusalOfMoments(run, words.rules);
  if (refusal === null) return null;
  if (refusal.reason === 'over' || refusal.reason === 'short') {
    return words.words(refusal.reason, { length: words.lengthLabel(refusal.by, words.locale) });
  }

  return words.t(refusal.reason);
}

/** What a shortcut writes: its two days, the parts they share written once. */
export function momentResultWords({ end, start }: DateTimeRange, { locale }: DateTimeRangeWords) {
  return start === null || end === null ? '' : shortRun(start.date, end.date, locale);
}

/** The value in the frame; `null` while there is none. */
export function momentSummary(
  held: DateTimeRange | null,
  words: DateTimeRangeWords,
): string | null {
  if (held === null) return null;

  const [start, end] = [held.start, held.end].map(
    (moment) => moment && shortMoment(moment, words.locale, words),
  );

  return `${start ?? ''} – ${end ?? ''}`.trim();
}

/** The trigger's name: focus returns there, so it carries both ends and the length. */
export function momentTriggerName(held: DateTimeRange | null, words: DateTimeRangeWords): string {
  if (!held?.start || !held.end) return words.t('choose');

  const format = createDateTimeFormat(words);
  const ends = { start: format.describe(held.start), end: format.describe(held.end) };
  const seconds = dateTimeRangeSeconds(held.start, held.end);

  return seconds < 0
    ? words.t('changeReversed', ends)
    : words.t('change', { ...ends, length: words.lengthLabel(seconds, words.locale) });
}

/** Whether both ends of a draft are there and no rule refuses them. */
export function isTakenRun(draft: MomentRunDraft, words: DateTimeRangeWords): boolean {
  const run = momentRunOf(draft);

  return run?.start != null && run.end !== null && refusalOfMoments(run, words.rules) === null;
}
