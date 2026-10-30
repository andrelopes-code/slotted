import type { ChartNumberFormat, ChartTimeFormat } from './types';

/**
 * A finite number, or nothing. `null`, `undefined`, `NaN`, the two infinities
 * and anything that is not a number are gaps: a chart draws a gap as a break
 * in the line, never as a zero.
 */
export function chartNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  return null;
}

/** `YYYY-MM-DD`, optionally followed by `THH:mm[:ss[.sss]]`, and no offset. */
const WALL_CLOCK =
  /^(\d{4,6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

function wallClock(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) {
  const time = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  return Number.isFinite(time) ? time : null;
}

/**
 * A time on the axis, as milliseconds of a UTC calendar holding the wall-clock
 * fields the consumer wrote.
 *
 * The library holds wall-clock values, never zoned instants
 * (`docs/build-briefing.md`, _Decisions already taken_), and a time axis
 * inherits the rule: read as UTC, a day on the axis is always twenty-four
 * hours long, and the hour a daylight change repeats or skips does not bend
 * the line. Accepted: a `PlainDate` or `PlainDateTime` of `@slotted/core/date`
 * (read by shape), an ISO text with no offset, a number already in that form,
 * and a `Date`, read through its local fields — the clock the reader of this
 * page sees on it. An ISO text with an offset is refused as a gap: the chart
 * cannot know which wall clock the application meant.
 */
export function chartTime(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return wallClock(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds(),
    );
  }
  if (typeof value === 'string') {
    const match = WALL_CLOCK.exec(value.trim());
    if (!match) return null;
    const [, year, month, day, hour, minute, second, fraction] = match;
    return wallClock(
      Number(year),
      Number(month),
      Number(day),
      Number(hour ?? 0),
      Number(minute ?? 0),
      Number(second ?? 0),
      Number((fraction ?? '0').padEnd(3, '0')),
    );
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if ('date' in record && 'time' in record) {
      const date = record['date'] as Record<string, unknown> | null;
      const time = record['time'] as Record<string, unknown> | null;
      if (!date || !time) return null;
      return wallClock(
        Number(date['year']),
        Number(date['month']),
        Number(date['day']),
        Number(time['hour']),
        Number(time['minute']),
        Number(time['second'] ?? 0),
      );
    }
    if ('year' in record && 'month' in record && 'day' in record) {
      return wallClock(Number(record['year']), Number(record['month']), Number(record['day']));
    }
  }
  return null;
}

const numberFormats = new Map<string, Intl.NumberFormat>();
const timeFormats = new Map<string, Intl.DateTimeFormat>();

function cached<F>(cache: Map<string, F>, key: string, create: () => F): F {
  let format = cache.get(key);
  if (!format) {
    format = create();
    cache.set(key, format);
  }
  return format;
}

export function createNumberFormatter(
  format: ChartNumberFormat | undefined,
  locale: string | undefined,
): (value: number) => string {
  if (typeof format === 'function') return (value) => format(value, locale);
  const options = format ?? { maximumFractionDigits: 2 };
  const intl = cached(
    numberFormats,
    `${locale ?? ''}|${JSON.stringify(options)}`,
    () => new Intl.NumberFormat(locale, options),
  );
  return (value) => intl.format(value);
}

/**
 * The time format a chart reads its axis in. Without options it chooses by
 * the span it is given: a year or more names months, a day or more names
 * days, and anything shorter names hours and minutes.
 */
export function createTimeFormatter(
  format: ChartTimeFormat | undefined,
  locale: string | undefined,
  span = 0,
): (value: number) => string {
  if (typeof format === 'function') return (value) => format(value, locale);
  const day = 86_400_000;
  const options: Intl.DateTimeFormatOptions =
    format ??
    (span >= 365 * day
      ? { month: 'short', year: 'numeric' }
      : span >= day
        ? { day: 'numeric', month: 'short' }
        : { hour: '2-digit', minute: '2-digit' });
  const intl = cached(
    timeFormats,
    `${locale ?? ''}|${JSON.stringify(options)}`,
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }),
  );
  return (value) => intl.format(value);
}
