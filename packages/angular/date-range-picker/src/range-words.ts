import { lengthOf, refusalOf, relativeDays, shortDay, shortRun } from '@slotted/core/date';
import type { DateRangeRules, PlainDate } from '@slotted/core/date';
import type {
  DateRangePickerMessages,
  FamilyTranslator,
  PickerPanelMessages,
} from '@slotted/core/i18n';

import type { DateRange } from '@slotted/angular/calendar';

/** What a run is written with. */
export interface RangeWords {
  readonly locale: string;
  readonly rules: DateRangeRules;
  readonly t: FamilyTranslator<DateRangePickerMessages>;
  readonly today: PlainDate;
  readonly words: FamilyTranslator<PickerPanelMessages>;
}

/** The one word for nothing: a value whose both ends are `null` is `null`. */
export function normalizeRange(range: DateRange | null): DateRange | null {
  return range === null || (range.start === null && range.end === null) ? null : range;
}

/** "4 nights": a length in the unit the rules count. */
export function lengthWords(count: number, { rules, t }: RangeWords): string {
  return t(`${rules.count}.length` as const, { count });
}

/** "2 to 7 nights", "at least 2 nights", "at most 7 nights"; nothing without a limit. */
export function limitWords({ rules, t }: RangeWords): string {
  const { count, maxLength, minLength } = rules;
  if (minLength !== undefined && maxLength !== undefined) {
    return t(`${count}.between` as const, { min: minLength, max: maxLength });
  }
  if (minLength !== undefined) return t(`${count}.atLeast` as const, { min: minLength });

  return maxLength === undefined ? '' : t(`${count}.atMost` as const, { max: maxLength });
}

/** Why a run is refused, in words; `null` for one that is taken. */
export function refusalWords(run: DateRange | null, words: RangeWords): string | null {
  const refusal = refusalOf(run, words.rules);
  if (refusal === null) return null;
  if (refusal.reason === 'over' || refusal.reason === 'short') {
    return words.words(refusal.reason, { length: lengthWords(refusal.by, words) });
  }

  return words.t(refusal.reason);
}

/** One end of a run: its day, and how far it is from today. */
export function endWords(date: PlainDate | null, { locale, today, words }: RangeWords) {
  return {
    empty: date === null,
    meta: date === null ? '' : relativeDays(today, date, locale),
    text: date === null ? words('chooseDay') : shortDay(date, locale),
  };
}

/** The length of a run as the head writes it. */
export function spanWords(run: DateRange | null, words: RangeWords): string {
  return lengthWords(lengthOf(run, words.rules), words);
}

/** What a shortcut writes: its two ends, the parts they share written once. */
export function resultWords({ end, start }: DateRange, { locale }: RangeWords): string {
  if (start === null || end === null) return '';

  return shortRun(start, end, locale);
}
