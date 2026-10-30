/**
 * A run of times, or of datetimes, and the rules a product puts on it.
 *
 * `date-range.ts` counts days and nothing else; a run with hours counts
 * seconds, and one function counting both would be two functions with an
 * `if`. This module is the seconds half: how long a run is, whether an end
 * may close it, and everything a whole value fails. None of it touches the
 * DOM, and the two bindings of each range picker must not each decide it.
 */

import type { DateRangeProblem } from './date-range';
import { addDays, compareDate, daysBetween, isDateInRange } from './plain-date';
import type { PlainDate } from './plain-date';
import { compareDateTime, dayWindow } from './plain-date-time';
import type { DayWindowOptions, PlainDateTime } from './plain-date-time';
import { compareTime, secondsOfDay } from './plain-time';
import type { PlainTime, TimeGranularity } from './plain-time';
import { nearestIndex } from './time-list';
import type { TimeOption } from './time-list';

/** A run of times, either end of which may still be open while it is drawn. */
export interface TimeRangeValue {
  readonly start: PlainTime | null;
  readonly end: PlainTime | null;
}

/** A run of datetimes, either end of which may still be open. */
export interface DateTimeRangeValue {
  readonly start: PlainDateTime | null;
  readonly end: PlainDateTime | null;
}

/** The shortest and longest run allowed, in seconds — the unit `step` is written in. */
export interface RunLengthRules {
  readonly minLength?: number | undefined;
  readonly maxLength?: number | undefined;
}

export interface TimeRangeRules extends RunLengthRules {
  readonly min?: PlainTime | undefined;
  readonly max?: PlainTime | undefined;
  readonly unavailable?: ((time: PlainTime) => boolean) | undefined;
}

export interface DateTimeRangeRules extends RunLengthRules, DayWindowOptions {
  readonly unavailableDay?: ((date: PlainDate) => boolean) | undefined;
  readonly unavailableTime?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;
  /** Whether the run may cross an unavailable day. On by default. */
  readonly contiguous?: boolean | undefined;
}

/** What a whole run fails, in the order a reader is told about it — the date run's list. */
export type RangeProblem = DateRangeProblem;

const SECONDS_PER_DAY = 86_400;

/** `b − a` in seconds; negative when `b` comes first. */
export function timeRangeSeconds(a: PlainTime, b: PlainTime): number {
  return secondsOfDay(b) - secondsOfDay(a);
}

/** `b − a` in seconds, the days between carried; negative when `b` comes first. */
export function dateTimeRangeSeconds(a: PlainDateTime, b: PlainDateTime): number {
  return daysBetween(a.date, b.date) * SECONDS_PER_DAY + timeRangeSeconds(a.time, b.time);
}

/**
 * A duration in words, one unit at a time: "2 hr 30 min", "3 days 21 hr".
 *
 * `Intl.NumberFormat` with `style: 'unit'` is what every runtime has;
 * `Intl.DurationFormat` is missing from Firefox before 139. The `short`
 * display reads as words in every locale — `narrow` writes "2h 30 Min." in
 * German — and still fits a band at 240 pixels. Units at zero are omitted,
 * seconds are written only at the second granularity, and a run of nothing is
 * "0 min" or "0 sec". The sign is dropped: a reversed run is the same length.
 */
export function durationLabel(
  seconds: number,
  locale?: string | undefined,
  granularity: TimeGranularity = 'minute',
): string {
  const total = Math.abs(Math.trunc(seconds));
  const days = Math.floor(total / SECONDS_PER_DAY);
  const hours = Math.floor((total % SECONDS_PER_DAY) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  const write = (unit: 'day' | 'hour' | 'minute' | 'second', count: number) =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(count);

  const parts: string[] = [];
  if (days > 0) parts.push(write('day', days));
  if (hours > 0) parts.push(write('hour', hours));
  if (minutes > 0) parts.push(write('minute', minutes));
  if (granularity === 'second' && rest > 0) parts.push(write('second', rest));
  if (parts.length === 0)
    parts.push(granularity === 'second' ? write('second', 0) : write('minute', 0));
  return parts.join(' ');
}

/**
 * Whether a candidate may close a run anchored at `anchor`, both in seconds.
 * `direction` is `1` when the candidate is the end being chosen after a start
 * and `-1` when it is the start being chosen before an end: the candidate on
 * the wrong side of the anchor is refused, and so is one whose run would fall
 * outside the length limits. Written for a list, which asks it about every
 * option while the other end is chosen.
 */
export function runRefusal(
  anchor: number,
  candidate: number,
  direction: 1 | -1,
  rules: RunLengthRules,
): boolean {
  const length = (candidate - anchor) * direction;
  if (length < 0) return true;
  if (rules.minLength !== undefined && length < rules.minLength) return true;
  if (rules.maxLength !== undefined && length > rules.maxLength) return true;
  return false;
}

/**
 * The first refused option on one side of an index, or `-1`. It walks the
 * list, which holds at most `maxOptions` entries, and never the seconds: a
 * contiguous run may not reach past it.
 */
export function firstUnavailableIndex(
  list: readonly TimeOption[],
  from: number,
  direction: 1 | -1,
): number {
  for (let index = from + direction; index >= 0 && index < list.length; index += direction) {
    if (list[index]?.unavailable === true) return index;
  }
  return -1;
}

/**
 * Where a list opens: on the wanted time when that row is offered, else on the
 * offered row nearest to it — the end list of a run that started at 14:00 opens
 * at 14:00 rather than at midnight, whatever the clock says. A proposal of no
 * length is none: when that row is the other end itself and the next row away
 * from it is offered, the list opens there. `-1` for an empty list; the first
 * row when nothing is offered, so the keyboard still has somewhere to land.
 */
export function openingIndex(
  list: readonly TimeOption[],
  wanted: PlainTime,
  otherEnd: PlainTime | null,
  position: 'start' | 'end',
): number {
  if (list.length === 0) return -1;
  const near = nearestIndex(list, wanted);
  let index = near;
  if (list[index]?.unavailable === true) {
    index = -1;
    list.forEach((option, candidate) => {
      if (option.unavailable === true) return;
      if (index < 0 || Math.abs(candidate - near) < Math.abs(index - near)) index = candidate;
    });
  }
  if (index < 0) return 0;
  const option = list[index];
  if (otherEnd !== null && option !== undefined && compareTime(option.time, otherEnd) === 0) {
    const next = list[index + (position === 'end' ? 1 : -1)];
    if (next !== undefined && next.unavailable !== true)
      return index + (position === 'end' ? 1 : -1);
  }
  return index;
}

function lengthProblem(seconds: number, rules: RunLengthRules): boolean {
  return (
    (rules.minLength !== undefined && seconds < rules.minLength) ||
    (rules.maxLength !== undefined && seconds > rules.maxLength)
  );
}

/**
 * Everything a time run fails. An end typed before its start is named and not
 * swapped, because a value the reader wrote is not the family's to rewrite —
 * and a shift that crosses midnight is exactly that: a `PlainTime` has no day,
 * and `datetime-range-picker` is the family that writes it.
 */
export function timeRangeProblems(
  value: TimeRangeValue | null,
  rules: TimeRangeRules,
): RangeProblem[] {
  if (value === null) return [];
  const problems: RangeProblem[] = [];
  const { start, end } = value;
  const ends = [start, end].filter((time): time is PlainTime => time !== null);

  const reversed = start !== null && end !== null && compareTime(end, start) < 0;
  if (reversed) problems.push('order');
  if (ends.some((time) => rules.min !== undefined && compareTime(time, rules.min) < 0)) {
    problems.push('min');
  }
  if (ends.some((time) => rules.max !== undefined && compareTime(time, rules.max) > 0)) {
    problems.push('max');
  }
  if (ends.some((time) => rules.unavailable?.(time) === true)) problems.push('unavailable');
  if (start !== null && end !== null && !reversed) {
    if (lengthProblem(timeRangeSeconds(start, end), rules)) problems.push('length');
  }
  return problems;
}

/**
 * Everything a datetime run fails. `min` and `max` bound the whole value and
 * `minTime` and `maxTime` bound the time on every day, both applied, through
 * the same `dayWindow` the list is drawn from. The day predicate runs over
 * every day of a contiguous run once per call and never per cell; the time
 * predicate runs over the two ends, on their own days.
 */
export function dateTimeRangeProblems(
  value: DateTimeRangeValue | null,
  rules: DateTimeRangeRules,
): RangeProblem[] {
  if (value === null) return [];
  const problems: RangeProblem[] = [];
  const { start, end } = value;
  const ends = [start, end].filter((item): item is PlainDateTime => item !== null);

  const reversed = start !== null && end !== null && compareDateTime(end, start) < 0;
  if (reversed) problems.push('order');

  const windows = ends.map((item) => ({ item, window: dayWindow(item.date, rules) }));
  const below = ({ item, window }: (typeof windows)[number]) =>
    window === null
      ? rules.min !== undefined && compareDate(item.date, rules.min.date) < 0
      : compareTime(item.time, window.earliest) < 0;
  const above = ({ item, window }: (typeof windows)[number]) =>
    window === null
      ? rules.max !== undefined && compareDate(item.date, rules.max.date) > 0
      : compareTime(item.time, window.latest) > 0;
  if (windows.some(below)) problems.push('min');
  if (windows.some(above)) problems.push('max');

  const whole = start !== null && end !== null && !reversed;
  const dayRefused =
    rules.unavailableDay !== undefined &&
    (whole && rules.contiguous !== false
      ? someDay(start.date, end.date, rules.unavailableDay)
      : ends.some((item) => rules.unavailableDay?.(item.date) === true));
  const timeRefused = ends.some((item) => rules.unavailableTime?.(item.time, item.date) === true);
  if (dayRefused || timeRefused) problems.push('unavailable');

  if (whole && lengthProblem(dateTimeRangeSeconds(start, end), rules)) problems.push('length');
  return problems;
}

function someDay(start: PlainDate, end: PlainDate, test: (date: PlainDate) => boolean): boolean {
  for (let date = start; isDateInRange(date, undefined, end); date = addDays(date, 1)) {
    if (test(date)) return true;
  }
  return false;
}
