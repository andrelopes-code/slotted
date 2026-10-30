/**
 * A date beside a time, and the arithmetic over the pair.
 *
 * `PlainDateTime` is **nested** rather than six flat fields: every function the
 * two halves already have — `addDays`, `clampDate`, `compareDate`,
 * `secondsOfDay`, `addSeconds`, `isTimeInRange` — applies to one half
 * unchanged, and the picker hands each half to the surface that owns it without
 * projecting anything. A flat shape would need a projection at every call site
 * and would invite a second copy of arithmetic that already exists twice over.
 * The cost is one line for a consumer converting to `Temporal.PlainDateTime`,
 * which is flat: `{ ...value.date, ...value.time }`.
 *
 * There is no zoned instant here and there will not be one. It is the type
 * every surveyed implementation gets wrong at a daylight boundary, and a
 * library that held one would owe an answer for the hour that happens twice and
 * the hour that never happens. What this library holds is the wall-clock value
 * the reader wrote; converting it is the application's, against the zone the
 * application knows.
 *
 * Nothing here touches the DOM or a framework.
 */

import {
  addDays,
  compareDate,
  isDateInRange,
  parseISODate,
  plainDate,
  toISODate,
} from './plain-date';
import type { PlainDate } from './plain-date';
import { addSeconds, compareTime, parseISOTime, plainTime, toISOTime } from './plain-time';
import type { PlainTime } from './plain-time';

export interface PlainDateTime {
  readonly date: PlainDate;
  readonly time: PlainTime;
}

/** `YYYY-MM-DDTHH:mm[:ss]`, and nothing after it. An offset is refused. */
const ISO_DATE_TIME = /^(\d{4,6}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/;

/** The last second of a day, which is what an unstated upper time bound means. */
export const END_OF_DAY: PlainTime = { hour: 23, minute: 59, second: 59 };
/** Midnight, which is what an unstated lower time bound means. */
export const START_OF_DAY: PlainTime = { hour: 0, minute: 0, second: 0 };

export function plainDateTime(date: PlainDate, time: PlainTime): PlainDateTime {
  return {
    date: plainDate(date.year, date.month, date.day),
    time: plainTime(time.hour, time.minute, time.second),
  };
}

export function isPlainDateTime(value: unknown): value is PlainDateTime {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { date?: unknown; time?: unknown };
  const date = candidate.date as PlainDate | undefined;
  const time = candidate.time as PlainTime | undefined;
  return (
    typeof date === 'object' &&
    date !== null &&
    typeof date.year === 'number' &&
    typeof date.month === 'number' &&
    typeof date.day === 'number' &&
    typeof time === 'object' &&
    time !== null &&
    typeof time.hour === 'number' &&
    typeof time.minute === 'number' &&
    typeof time.second === 'number'
  );
}

/** Negative when `a` is earlier, positive when later, zero when they agree. */
export function compareDateTime(a: PlainDateTime, b: PlainDateTime): number {
  const days = compareDate(a.date, b.date);
  return days !== 0 ? days : compareTime(a.time, b.time);
}

export function isSameDateTime(a: PlainDateTime | null, b: PlainDateTime | null): boolean {
  if (a === null || b === null) return a === b;
  return compareDateTime(a, b) === 0;
}

export function isDateTimeInRange(
  value: PlainDateTime,
  min?: PlainDateTime | undefined,
  max?: PlainDateTime | undefined,
): boolean {
  if (min !== undefined && compareDateTime(value, min) < 0) return false;
  if (max !== undefined && compareDateTime(value, max) > 0) return false;
  return true;
}

export function parseISODateTime(text: string): PlainDateTime | null {
  const match = ISO_DATE_TIME.exec(text.trim());
  if (match === null) return null;
  const date = parseISODate(match[1] as string);
  const time = parseISOTime(match[2] as string);
  if (date === null || time === null) return null;
  return { date, time };
}

/** `YYYY-MM-DDTHH:mm:ss`, which is `input[type=datetime-local]`'s own value. */
export function toISODateTime(value: PlainDateTime): string {
  return `${toISODate(value.date)}T${toISOTime(value.time)}`;
}

/** Now, as a wall-clock value in the zone the caller names. */
export function nowDateTimeIn(timeZone?: string | undefined): PlainDateTime {
  return wallClockIn(Date.now(), timeZone);
}

/**
 * What a clock on the wall in `timeZone` read at `instant`.
 *
 * This is the one conversion the library performs, and it goes in the direction
 * that has one answer: every instant has exactly one wall-clock reading in a
 * zone. The reverse has none in the hour a spring change skips and two in the
 * hour an autumn change repeats, which is why the reverse stays the
 * application's. An application holding instants — a server's timestamps —
 * calls this once per value to hand a family the wall-clock values it draws.
 *
 * Date and time are read from one `formatToParts`, so a value taken a
 * millisecond before midnight cannot come back with tomorrow's date beside
 * today's time. `hourCycle: 'h23'` and the `% 24` answer the engine that writes
 * midnight as `24`, as `nowIn` does.
 */
export function wallClockIn(instant: Date | number, timeZone?: string | undefined): PlainDateTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(typeof instant === 'number' ? new Date(instant) : instant);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const year = read('year');
  const beforeCommonEra = parts.find((part) => part.type === 'era')?.value === 'BC';
  return {
    date: { year: beforeCommonEra ? 1 - year : year, month: read('month'), day: read('day') },
    time: { hour: read('hour') % 24, minute: read('minute'), second: read('second') },
  };
}

/**
 * Seconds added to the whole value, with the day carried.
 *
 * `addSeconds` already reports the midnights a step crossed, because a
 * `PlainTime` has no day to put them in. Here there is one, so the crossing is
 * not a flag beside the value — it is the value.
 */
export function addDateTimeSeconds(value: PlainDateTime, seconds: number): PlainDateTime {
  const stepped = addSeconds(value.time, seconds);
  return { date: addDays(value.date, stepped.days), time: stepped.time };
}

/** The earliest and latest time one day is open for. */
export interface DayWindow {
  readonly earliest: PlainTime;
  readonly latest: PlainTime;
}

export interface DayWindowOptions {
  /** The whole-value lower bound: where the range starts. */
  readonly min?: PlainDateTime | undefined;
  /** The whole-value upper bound: where the range ends. */
  readonly max?: PlainDateTime | undefined;
  /** The lower bound of every day inside the range. */
  readonly minTime?: PlainTime | undefined;
  /** The upper bound of every day inside the range. */
  readonly maxTime?: PlainTime | undefined;
}

/**
 * What one day is open for, from both pairs of bounds at once.
 *
 * `min`/`max` bound the whole value and `minTime`/`maxTime` bound the time on
 * every day, and **both apply**. MUI's own validation page records that it
 * cannot do this: "you cannot use `maxDateTime` and `maxTime` together.
 * `maxDateTime` will override the `maxTime` behavior." They are two questions —
 * where the range starts, and what a day is open for — and both are answered.
 *
 * On `min`'s own day the window starts at `min`'s time; on `max`'s own day it
 * ends at `max`'s time; on every day between, at `minTime` and `maxTime`. MDN
 * states that rule for `input[type=datetime-local]` — "the time of day is only
 * constrained on the first and last dates in the range" — and no surveyed
 * script implements it.
 *
 * `null` is a day the range refuses outright, and a day whose two bounds have
 * crossed: a `min` of 18:00 on the range's first day against a `maxTime` of
 * 17:00 leaves nothing, and saying so is what lets a panel draw its empty state
 * rather than an empty box.
 */
export function dayWindow(date: PlainDate, options: DayWindowOptions = {}): DayWindow | null {
  const { min, max, minTime, maxTime } = options;

  if (min !== undefined && compareDate(date, min.date) < 0) return null;
  if (max !== undefined && compareDate(date, max.date) > 0) return null;

  const floor = minTime ?? START_OF_DAY;
  const ceiling = maxTime ?? END_OF_DAY;

  const onMinDay = min !== undefined && compareDate(date, min.date) === 0;
  const onMaxDay = max !== undefined && compareDate(date, max.date) === 0;

  const earliest =
    onMinDay && compareTime((min as PlainDateTime).time, floor) > 0
      ? (min as PlainDateTime).time
      : floor;
  const latest =
    onMaxDay && compareTime((max as PlainDateTime).time, ceiling) < 0
      ? (max as PlainDateTime).time
      : ceiling;

  return compareTime(earliest, latest) > 0 ? null : { earliest, latest };
}

/**
 * Whether a whole day is refused by the bounds alone.
 *
 * It is the question a calendar cell asks, and it cannot be derived from a
 * datetime-level predicate without probing every step of that day — which is
 * why the family takes two predicates rather than one.
 */
export function isDayInRange(date: PlainDate, options: DayWindowOptions = {}): boolean {
  return dayWindow(date, options) !== null;
}

/** The date half of a range, for a calendar that only bounds days. */
export function dateBoundsOf(options: DayWindowOptions = {}): {
  min: PlainDate | undefined;
  max: PlainDate | undefined;
} {
  return { min: options.min?.date, max: options.max?.date };
}

/** Whether a date falls inside the date half of the bounds. */
export function isDateWithin(date: PlainDate, options: DayWindowOptions = {}): boolean {
  const { min, max } = dateBoundsOf(options);
  return isDateInRange(date, min, max);
}
