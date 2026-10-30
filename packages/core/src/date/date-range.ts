/**
 * A run of days, and the rules a product puts on it.
 *
 * `calendar` decides which two dates a press makes into a run; this module
 * decides what a run is worth — how long it is, whether it may cross a day the
 * product refuses, and whether it fits the limits. None of it touches the DOM,
 * and the two bindings of `date-range-picker` must not each decide it.
 */

import { addDays, compareDate, daysBetween, isDateInRange } from './plain-date';
import type { PlainDate } from './plain-date';

/** A run of days, either end of which may still be open while it is drawn. */
export interface DateRangeValue {
  readonly start: PlainDate | null;
  readonly end: PlainDate | null;
}

/**
 * What the length counts. `days` counts both ends — a leave request from the
 * 12th to the 16th is five days — and `nights` counts the gaps between them,
 * which is what a stay from the 12th to the 16th costs.
 */
export type DateRangeCount = 'days' | 'nights';

export interface DateRangeRules {
  readonly count: DateRangeCount;
  readonly min?: PlainDate | undefined;
  readonly max?: PlainDate | undefined;
  readonly unavailable?: ((date: PlainDate) => boolean) | undefined;
  /** Whether the run may cross an unavailable day. On by default. */
  readonly contiguous?: boolean | undefined;
  /** The shortest and longest run allowed, in the unit `count` names. */
  readonly minLength?: number | undefined;
  readonly maxLength?: number | undefined;
}

/** What a whole run fails, in the order a reader is told about it. */
export type DateRangeProblem = 'order' | 'min' | 'max' | 'unavailable' | 'length';

/** The two dates in order, whichever was chosen first. */
export function orderedRun(a: PlainDate, b: PlainDate): { start: PlainDate; end: PlainDate } {
  return compareDate(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

/** How long the run is in the unit named. Order does not matter. */
export function rangeLength(a: PlainDate, b: PlainDate, count: DateRangeCount): number {
  const nights = Math.abs(daysBetween(a, b));
  return count === 'days' ? nights + 1 : nights;
}

/**
 * The first unavailable day on either side of a chosen start, looking at
 * most `limit` days each way. It is computed once per start, so a grid that
 * asks about every visible cell never walks the calendar per cell.
 */
export function blockedAround(
  start: PlainDate,
  unavailable: (date: PlainDate) => boolean,
  limit: number,
): { before: PlainDate | null; after: PlainDate | null } {
  let before: PlainDate | null = null;
  let after: PlainDate | null = null;
  for (let step = 1; step <= limit && after === null; step += 1) {
    const date = addDays(start, step);
    if (unavailable(date)) after = date;
  }
  for (let step = 1; step <= limit && before === null; step += 1) {
    const date = addDays(start, -step);
    if (unavailable(date)) before = date;
  }
  return { before, after };
}

/**
 * Whether a day may close a run that starts at `start`: the day itself is
 * available, the run would not cross an unavailable day while it has to be
 * contiguous, and its length would fit the limits. Written for the grid,
 * which asks it about every visible cell while the run is open.
 */
export function isDateRefusedInRun(
  start: PlainDate,
  date: PlainDate,
  rules: Pick<DateRangeRules, 'contiguous' | 'count' | 'maxLength' | 'minLength' | 'unavailable'>,
  blocked: { before: PlainDate | null; after: PlainDate | null } = blockedAround(
    start,
    rules.unavailable ?? (() => false),
    rules.maxLength ?? 366,
  ),
): boolean {
  if (rules.unavailable?.(date) === true) return true;
  if (rules.contiguous !== false) {
    if (blocked.after !== null && compareDate(date, blocked.after) >= 0) return true;
    if (blocked.before !== null && compareDate(date, blocked.before) <= 0) return true;
  }
  const length = rangeLength(start, date, rules.count);
  if (rules.minLength !== undefined && length < rules.minLength) return true;
  if (rules.maxLength !== undefined && length > rules.maxLength) return true;
  return false;
}

/**
 * Everything a value fails. An end typed before its start is named and not
 * swapped, because a value the reader wrote is not the family's to rewrite.
 * The predicate runs over every day of a whole contiguous run, once per call
 * and never per cell: a run of two years is 730 calls on a change, not on a
 * key.
 */
export function rangeProblems(
  value: DateRangeValue | null,
  rules: DateRangeRules,
): DateRangeProblem[] {
  if (value === null) return [];
  const problems: DateRangeProblem[] = [];
  const { start, end } = value;
  const ends = [start, end].filter((date): date is PlainDate => date !== null);

  if (start !== null && end !== null && compareDate(end, start) < 0) problems.push('order');
  if (ends.some((date) => rules.min !== undefined && compareDate(date, rules.min) < 0)) {
    problems.push('min');
  }
  if (ends.some((date) => rules.max !== undefined && compareDate(date, rules.max) > 0)) {
    problems.push('max');
  }

  if (rules.unavailable !== undefined) {
    const whole = start !== null && end !== null && compareDate(start, end) <= 0;
    const refused =
      whole && rules.contiguous !== false
        ? someDay(start, end, rules.unavailable)
        : ends.some((date) => rules.unavailable?.(date) === true);
    if (refused) problems.push('unavailable');
  }

  if (start !== null && end !== null && !problems.includes('order')) {
    const length = rangeLength(start, end, rules.count);
    if (
      (rules.minLength !== undefined && length < rules.minLength) ||
      (rules.maxLength !== undefined && length > rules.maxLength)
    ) {
      problems.push('length');
    }
  }
  return problems;
}

function someDay(start: PlainDate, end: PlainDate, test: (date: PlainDate) => boolean): boolean {
  for (let date = start; isDateInRange(date, undefined, end); date = addDays(date, 1)) {
    if (test(date)) return true;
  }
  return false;
}
