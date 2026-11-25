import type { FamilyTranslator } from '../i18n/translator';
import type { PickerPanelMessages } from '../i18n/messages/picker-panel';
import { daysBetween, isoWeekNumber } from './plain-date';
import type { PlainDate } from './plain-date';
import type { PlainDateTime } from './plain-date-time';
import { secondsOfDay } from './plain-time';
import type { PlainTime, TimeGranularity } from './plain-time';
import { relativeDays } from './relative';
import { dateTimeRangeSeconds, durationLabel, timeRangeSeconds } from './time-range';

type Words = FamilyTranslator<PickerPanelMessages>;

/** The clock a moment is written on. */
interface MomentShape {
  readonly granularity?: TimeGranularity | undefined;
  readonly hourCycle?: 12 | 24 | undefined;
}

/** How far a date is from today, and the week it is in: "in 5 days, week 49". */
export function dayMeta(date: PlainDate, today: PlainDate, locale: string, t: Words): string {
  return t('dayInWeek', {
    day: relativeDays(today, date, locale),
    week: isoWeekNumber(date),
  });
}

/** A day as a shortcut or the end of a run writes it: "Mon, Nov 30". */
export function shortDay(date: PlainDate, locale: string): string {
  return dayFormat(locale, { day: 'numeric', month: 'short', weekday: 'short' }).format(utc(date));
}

/** A day as the head of a panel writes it, its year named when it is not this one. */
export function headDay(date: PlainDate, today: PlainDate, locale: string): string {
  return dayFormat(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    ...(date.year === today.year ? {} : { year: 'numeric' }),
  }).format(utc(date));
}

/** A run of days, the parts the two ends share written once: "Nov 27 – Dec 4". */
export function shortRun(start: PlainDate, end: PlainDate, locale: string): string {
  return dayFormat(locale, { day: 'numeric', month: 'short' }).formatRange(utc(start), utc(end));
}

/** A weekday and how far its date is from today: "Fri, in 2 days". */
export function weekdayMeta(date: PlainDate, today: PlainDate, locale: string, t: Words): string {
  const days = daysBetween(today, date);
  /* Short: a half has no room for "the day after tomorrow", which some locales write. */
  const numeric = Math.abs(days) > 1 ? 'always' : 'auto';

  return t('weekdayIn', {
    distance: new Intl.RelativeTimeFormat(locale, { numeric }).format(days, 'day'),
    weekday: dayFormat(locale, { weekday: 'short' }).format(utc(date)),
  });
}

/** A moment as a shortcut writes it: "Nov 30, 2:30 PM". */
export function shortMoment(
  { date, time }: PlainDateTime,
  locale: string,
  { granularity = 'minute', hourCycle }: MomentShape = {},
): string {
  return dayFormat(locale, {
    day: 'numeric',
    hour: 'numeric',
    month: 'short',
    ...(granularity === 'hour' ? {} : { minute: '2-digit' }),
    ...(granularity === 'second' ? { second: '2-digit' } : {}),
    ...(hourCycle === undefined ? {} : { hourCycle: hourCycle === 24 ? 'h23' : 'h12' }),
  }).format(new Date(utc(date).getTime() + secondsOfDay(time) * 1000));
}

/** A run of times as a shortcut writes it: "9:00 – 11:45 AM". */
export function shortTimeRun(
  start: PlainTime,
  end: PlainTime,
  locale: string,
  { granularity = 'minute', hourCycle }: MomentShape = {},
): string {
  const format = dayFormat(locale, {
    hour: hourCycle === 12 ? 'numeric' : '2-digit',
    ...(granularity === 'hour' ? {} : { minute: '2-digit' }),
    ...(granularity === 'second' ? { second: '2-digit' } : {}),
    ...(hourCycle === undefined ? {} : { hourCycle: hourCycle === 24 ? 'h23' : 'h12' }),
  });

  return format.formatRange(secondsOfDay(start) * 1000, secondsOfDay(end) * 1000);
}

/** How far a month is from this one: "next month", "in 3 months". */
export function monthMeta(date: PlainDate, today: PlainDate, locale: string): string {
  const months = (date.year - today.year) * 12 + (date.month - today.month);

  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(months, 'month');
}

/** How far a time of the same day is from now: "in 4 hr 10 min". */
export function timeMeta(
  time: PlainTime,
  now: PlainTime,
  locale: string,
  t: Words,
  granularity?: TimeGranularity,
): string {
  return distance(timeRangeSeconds(now, time), locale, t, granularity);
}

/** How far a moment is from now, the days between carried. */
export function momentMeta(
  moment: PlainDateTime,
  now: PlainDateTime,
  locale: string,
  t: Words,
): string {
  return distance(dateTimeRangeSeconds(now, moment), locale, t);
}

/** A step from now, or the length of a run: "+1 hr", "2 days". */
export function stepLabel(seconds: number, locale: string): string {
  return `+${durationLabel(seconds, locale)}`;
}

function dayFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
}

function utc({ day, month, year }: PlainDate): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function distance(
  seconds: number,
  locale: string,
  t: Words,
  granularity: TimeGranularity = 'minute',
): string {
  if (seconds === 0) return t('now');

  const length = durationLabel(seconds, locale, granularity);

  return seconds > 0 ? t('ahead', { length }) : t('behind', { length });
}
