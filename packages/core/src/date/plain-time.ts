/**
 * One wall-clock time, with no date and no zone, and the arithmetic over it.
 *
 * `Date` is an instant, and an instant is the type every surveyed time picker
 * gets wrong at a daylight boundary: a library that holds one owes an answer
 * for the hour that happens twice and the hour that never happens. What a
 * reader types into a time field is neither — it is `09:00`, the same `09:00`
 * the shop opens at in every zone the application serves. Converting it to an
 * instant is the application's, against the zone the application knows.
 *
 * So the value is three numbers. Decided in wave 7 and recorded in
 * `docs/build-briefing.md` under _Decisions already taken_.
 *
 * Nothing here touches the DOM or a framework.
 */

export interface PlainTime {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

/**
 * A step's result. A time has no day beside it, so a step that runs past
 * midnight lands on a different one — and `days` is the only place that fact
 * can be said. No surveyed implementation says it at all.
 */
export interface TimeStep {
  readonly time: PlainTime;
  /** Midnights crossed: positive going forward, negative going back. */
  readonly days: number;
}

/** How much of a time is written. The picker's own axis, and the field's. */
export type TimeGranularity = 'hour' | 'minute' | 'second';

export const SECONDS_PER_DAY = 86_400;
/** `HH:mm` or `HH:mm:ss`, and nothing after it. A fraction is refused. */
const ISO_TIME = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function isPlainTime(value: unknown): value is PlainTime {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PlainTime>;
  return (
    Number.isInteger(candidate.hour) &&
    Number.isInteger(candidate.minute) &&
    Number.isInteger(candidate.second)
  );
}

/**
 * Builds a time, refusing one the clock does not have. `24:00` is midnight
 * written by an engine that counts from one, and accepting it here would let
 * two values mean the same instant of the day.
 */
export function plainTime(hour: number, minute = 0, second = 0): PlainTime {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`hour must be 0 to 23, got ${hour}`);
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError(`minute must be 0 to 59, got ${minute}`);
  }
  if (!Number.isInteger(second) || second < 0 || second > 59) {
    throw new RangeError(`second must be 0 to 59, got ${second}`);
  }
  return { hour, minute, second };
}

export function compareTime(a: PlainTime, b: PlainTime): number {
  return secondsOfDay(a) - secondsOfDay(b);
}

export function isSameTime(a: PlainTime | null, b: PlainTime | null): boolean {
  if (a === null || b === null) return a === b;
  return compareTime(a, b) === 0;
}

export function secondsOfDay(time: PlainTime): number {
  return time.hour * 3600 + time.minute * 60 + time.second;
}

/** Reads a count of seconds back as a time, wrapping whatever day it ran into. */
export function timeOfSeconds(seconds: number): PlainTime {
  const inDay = ((Math.trunc(seconds) % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  return {
    hour: Math.floor(inDay / 3600),
    minute: Math.floor((inDay % 3600) / 60),
    second: inDay % 60,
  };
}

/**
 * Steps a time, and says how many midnights the step crossed.
 *
 * `Math.floor` rather than a truncation, so a step backwards past midnight
 * reports `-1` instead of `0`: `-1 / 86400` truncates to zero and would say a
 * step into yesterday stayed in today.
 */
export function addSeconds(time: PlainTime, seconds: number): TimeStep {
  const total = secondsOfDay(time) + Math.trunc(seconds);
  return { time: timeOfSeconds(total), days: Math.floor(total / SECONDS_PER_DAY) };
}

export function clampTime(
  time: PlainTime,
  min: PlainTime | undefined,
  max: PlainTime | undefined,
): PlainTime {
  if (min !== undefined && compareTime(time, min) < 0) return min;
  if (max !== undefined && compareTime(time, max) > 0) return max;
  return time;
}

export function isTimeInRange(
  time: PlainTime,
  min: PlainTime | undefined,
  max: PlainTime | undefined,
): boolean {
  if (min !== undefined && compareTime(time, min) < 0) return false;
  return max === undefined || compareTime(time, max) <= 0;
}

/**
 * The shape a plain form post carries, and the one `parseISOTime` reads back.
 * The granularity decides how much of it is written, so a field that never
 * shows seconds does not post a precision the reader did not state.
 */
export function toISOTime(time: PlainTime, granularity: TimeGranularity = 'second'): string {
  const hour = String(time.hour).padStart(2, '0');
  if (granularity === 'hour') return hour;
  const minute = String(time.minute).padStart(2, '0');
  if (granularity === 'minute') return `${hour}:${minute}`;
  return `${hour}:${minute}:${String(time.second).padStart(2, '0')}`;
}

/** Reads `HH:mm` and `HH:mm:ss`, and nothing else. */
export function parseISOTime(text: string): PlainTime | null {
  const match = ISO_TIME.exec(text.trim());
  if (match === null) return null;
  const [, hour, minute, second] = match as unknown as [string, string, string, string | undefined];
  try {
    return plainTime(Number(hour), Number(minute), Number(second ?? 0));
  } catch {
    return null;
  }
}

/**
 * What the clock says in one zone, right now.
 *
 * `hourCycle: 'h23'` is asked for explicitly because the default for `en-US`
 * is `h12`, and an engine answering the `h24` cycle writes midnight as `24`.
 * Neither is a time this library has, so the read is normalized rather than
 * trusted — `24` is `0` and the day it belongs to is not this function's.
 */
export function nowIn(timeZone?: string): PlainTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { hour: read('hour') % 24, minute: read('minute'), second: read('second') };
}
