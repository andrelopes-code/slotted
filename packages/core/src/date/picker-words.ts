import type { FamilyTranslator } from '../i18n/translator';
import type { PickerPanelMessages } from '../i18n/messages/picker-panel';
import { isoWeekNumber } from './plain-date';
import type { PlainDate } from './plain-date';
import type { PlainDateTime } from './plain-date-time';
import type { PlainTime, TimeGranularity } from './plain-time';
import { relativeDays } from './relative';
import { dateTimeRangeSeconds, durationLabel, timeRangeSeconds } from './time-range';

type Words = FamilyTranslator<PickerPanelMessages>;

/** How far a date is from today, and the week it is in: "in 5 days, week 49". */
export function dayMeta(date: PlainDate, today: PlainDate, locale: string, t: Words): string {
  return `${relativeDays(today, date, locale)}, ${t('week', { week: isoWeekNumber(date) })}`;
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
