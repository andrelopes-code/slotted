/**
 * The arithmetic of a run of days a panel composes: how far a step may take
 * its end, how much of it is past its limit, and what it is refused for.
 */

import { rangeLength, rangeProblems } from './date-range';
import type { DateRangeRules, DateRangeValue } from './date-range';
import { addDays, compareDate } from './plain-date';
import type { PlainDate } from './plain-date';

/** Why a run is refused, and by how much when its length is the reason. */
export type RunRefusal =
  | { readonly reason: 'bounds' | 'order' | 'unavailable' }
  | { readonly reason: 'over' | 'short'; readonly by: number };

/** The run with its end one day later or earlier, when the rules take it. */
export function stepRun(
  run: DateRangeValue,
  direction: 1 | -1,
  rules: DateRangeRules,
): DateRangeValue | null {
  if (run.start === null || run.end === null) return null;

  const next = { start: run.start, end: addDays(run.end, direction) };
  const shortest = rules.minLength ?? 1;
  if (direction === -1 && lengthOf(next, rules) < shortest) return null;
  /* A step towards the limit is taken from outside it too. */
  if (direction === -1 && refusalOf(next, rules)?.reason === 'over') return next;

  return rangeProblems(next, rules).length === 0 ? next : null;
}

/** Whether a day of a run is past the longest it may be. */
export function isPastLimit(
  run: DateRangeValue | null,
  date: PlainDate,
  rules: DateRangeRules,
): boolean {
  if (run === null || run.start === null || rules.maxLength === undefined) return false;

  return (
    compareDate(date, run.start) > 0 && rangeLength(run.start, date, rules.count) > rules.maxLength
  );
}

/** The first thing a run fails, in the order a reader is told about it. */
export function refusalOf(run: DateRangeValue | null, rules: DateRangeRules): RunRefusal | null {
  const [problem] = rangeProblems(run, rules);
  if (problem === undefined || run === null) return null;
  if (problem === 'order' || problem === 'unavailable') return { reason: problem };
  if (problem !== 'length') return { reason: 'bounds' };

  const length = lengthOf(run, rules);
  const { maxLength, minLength } = rules;

  return maxLength !== undefined && length > maxLength
    ? { by: length - maxLength, reason: 'over' }
    : { by: (minLength ?? length) - length, reason: 'short' };
}

/** The length of a whole run in order, in the unit its rules count; 0 otherwise. */
export function lengthOf(run: DateRangeValue | null, { count }: DateRangeRules): number {
  if (run === null || run.start === null || run.end === null) return 0;

  return compareDate(run.start, run.end) > 0 ? 0 : rangeLength(run.start, run.end, count);
}
