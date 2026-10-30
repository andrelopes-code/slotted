/**
 * What choosing a date does to a value, in the three modes the family ships.
 *
 * It is separate from the component because none of it touches the DOM: a
 * range that is completed, a range that is restarted, and a set that a second
 * press takes a date back out of are all arithmetic over `PlainDate`, and the
 * two bindings must not each decide them.
 */

import { compareDate, isSameDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';

import type { CalendarSelectionMode, CalendarValue, DateRange } from './calendar-defaults';

export function isRange(value: CalendarValue): value is DateRange {
  return value !== null && !Array.isArray(value) && 'start' in value;
}

export function asDates(value: CalendarValue): PlainDate[] {
  if (value === null) return [];
  if (Array.isArray(value)) return value;
  if (isRange(value)) return [value.start, value.end].filter((date) => date !== null);
  return [value];
}

/**
 * Whether a date is one of the two ends of a run, inside it, or none of the
 * three. A range with one end open has a start and no run, which is what the
 * calendar draws while the reader is choosing the second date.
 */
export function rangeStateOf(
  date: PlainDate,
  value: CalendarValue,
): 'start' | 'end' | 'inside' | null {
  if (!isRange(value)) return null;
  const { start, end } = value;
  if (start !== null && isSameDate(date, start)) return 'start';
  if (end !== null && isSameDate(date, end)) return 'end';
  if (start === null || end === null) return null;
  return compareDate(date, start) > 0 && compareDate(date, end) < 0 ? 'inside' : null;
}

export function isSelected(date: PlainDate, value: CalendarValue): boolean {
  if (isRange(value)) {
    const state = rangeStateOf(date, value);
    return state === 'start' || state === 'end';
  }
  return asDates(value).some((candidate) => isSameDate(candidate, date));
}

/**
 * The value a press produces.
 *
 * A range takes two presses and the second one may come first: a reader who
 * chooses the 11th and then the 7th means the 7th to the 11th, not a range
 * that runs backwards. A third press starts again, because a range that grew
 * on every press could never be narrowed.
 *
 * A set removes a date a second press lands on, which is the only way to take
 * one back out without a second control.
 */
export function nextValue(
  date: PlainDate,
  value: CalendarValue,
  mode: CalendarSelectionMode,
): CalendarValue {
  if (mode === 'single') {
    return isSelected(date, value) ? null : date;
  }

  if (mode === 'multiple') {
    const held = asDates(value);
    const without = held.filter((candidate) => !isSameDate(candidate, date));
    if (without.length !== held.length) return without;
    return [...held, date].sort(compareDate);
  }

  const run = isRange(value) ? value : { start: null, end: null };
  if (run.start === null || run.end !== null) return { start: date, end: null };
  return compareDate(date, run.start) < 0
    ? { start: date, end: run.start }
    : { start: run.start, end: date };
}

/**
 * The run the grid draws while the reader is choosing the second end: from
 * the chosen start to the pending end — the day under the pointer, or the
 * focused day — ordered the way the second press will order it. `null` while
 * there is no open run, so a whole range and a single date preview nothing.
 */
export function previewRun(value: CalendarValue, pending: PlainDate | null): DateRange | null {
  if (pending === null || !isRange(value) || value.start === null || value.end !== null)
    return null;
  return compareDate(pending, value.start) < 0
    ? { start: pending, end: value.start }
    : { start: value.start, end: pending };
}

/** Value equality, which `Object.is` cannot give for a run or a set. */
export function isSameValue(a: CalendarValue, b: CalendarValue): boolean {
  if (isRange(a) || isRange(b)) {
    if (!isRange(a) || !isRange(b)) return false;
    return isSameDate(a.start, b.start) && isSameDate(a.end, b.end);
  }
  const left = asDates(a);
  const right = asDates(b);
  if (left.length !== right.length) return false;
  return left.every((date, index) => isSameDate(date, right[index] ?? null));
}
