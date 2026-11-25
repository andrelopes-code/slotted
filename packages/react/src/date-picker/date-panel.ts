import {
  dayMeta,
  headDay,
  isDateInRange,
  monthMeta,
  rangeLength,
  shortDay,
  shortRun,
} from '@slotted/core/date';
import type { DateFormat, PlainDate } from '@slotted/core/date';
import type { FamilyTranslator, PickerPanelMessages } from '@slotted/core/i18n';

import { asDates, isRange } from '../calendar';
import type { CalendarValue } from '../calendar';

/** What a value of the panel is written against. */
export interface DateWords {
  readonly format: DateFormat;
  readonly locale: string;
  readonly monthly: boolean;
  readonly t: FamilyTranslator<PickerPanelMessages>;
  readonly today: PlainDate;
}

/** The dates a picker takes. */
export interface DateRules {
  readonly isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  readonly max?: PlainDate | undefined;
  readonly min?: PlainDate | undefined;
}

/** The value in words, and what it means beside today. */
export interface DateHead {
  readonly empty: boolean;
  readonly meta: string;
  readonly value: string;
}

export function isRefusedDate(value: CalendarValue, rules: DateRules): boolean {
  return asDates(value).some(
    (date) =>
      !isDateInRange(date, rules.min, rules.max) || rules.isDateUnavailable?.(date) === true,
  );
}

/** A run with one end is a run still being drawn. */
export function isWholeDate(value: CalendarValue): boolean {
  return isRange(value) ? value.start !== null && value.end !== null : asDates(value).length > 0;
}

export function dateHead(value: CalendarValue, words: DateWords): DateHead {
  const { format, locale, monthly, t, today } = words;
  const [first, ...rest] = asDates(value);

  if (first === undefined) {
    const day = monthly ? format.monthYear(today) : shortDay(today, locale);

    return {
      empty: true,
      meta: t('todayIs', { day }),
      value: monthly ? t('chooseMonth') : t('chooseDay'),
    };
  }
  if (monthly) {
    return {
      empty: false,
      meta: monthMeta(first, today, locale),
      value: format.monthYear(first),
    };
  }
  if (rest.length === 0) {
    return {
      empty: false,
      meta: dayMeta(first, today, locale, t),
      value: headDay(first, today, locale),
    };
  }

  const count = isRange(value) ? rangeLength(first, rest.at(-1) ?? first, 'days') : rest.length + 1;

  return {
    empty: false,
    meta: dayMeta(first, today, locale, t),
    value: isRange(value)
      ? t('runOfDays', { count, run: shortRun(first, rest.at(-1) ?? first, locale) })
      : t('days', { count }),
  };
}

/** What a shortcut writes, in words. */
export function dateResult(value: CalendarValue, { format, locale, monthly }: DateWords): string {
  const dates = asDates(value);
  const [first] = dates;
  const last = dates.at(-1);
  if (first === undefined || last === undefined) return '';
  if (monthly) return format.monthYear(first, 'short');

  return dates.length === 1 ? shortDay(first, locale) : shortRun(first, last, locale);
}

/** The months a value is in, both ends, as the jump counts them. */
export function monthsOf(value: CalendarValue): readonly [number, number] | null {
  const months = asDates(value).map(({ month, year }) => year * 12 + month);

  return months.length === 0 ? null : [Math.min(...months), Math.max(...months)];
}
