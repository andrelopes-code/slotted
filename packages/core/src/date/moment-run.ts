/**
 * The arithmetic of a run of moments a panel composes: its four halves, the
 * one that is chosen next, which days and times close it, and how far a step
 * may take its end.
 */

import { blockedAround, isDateRefusedInRun } from './date-range';
import { dayTimes, isRefusedDay, isSameMomentDraft, momentDraft, momentOf } from './moment';
import type { DayTimes, MomentDraft, MomentRules } from './moment';
import { addDays, compareDate, isSameDate } from './plain-date';
import type { PlainDate } from './plain-date';
import { addDateTimeSeconds } from './plain-date-time';
import type { PlainDateTime } from './plain-date-time';
import type { PlainTime } from './plain-time';
import type { RunRefusal } from './range-panel';
import { closingTimes, refusalOfSeconds } from './time-run';
import { dateTimeRangeProblems, dateTimeRangeSeconds, runRefusal } from './time-range';
import type { DateTimeRangeRules, DateTimeRangeValue } from './time-range';

/** How far `contiguous` looks for an unavailable day. */
const CONTIGUOUS_SEARCH = 366;

const START_OF_DAY: PlainTime = { hour: 0, minute: 0, second: 0 };
const END_OF_DAY: PlainTime = { hour: 23, minute: 59, second: 59 };

/** The rules of a run of moments, and the list its times are offered from. */
export interface MomentRunRules extends DateTimeRangeRules {
  readonly options?: readonly PlainTime[] | undefined;
  readonly step: number;
}

/** A run being composed: any of its four halves may still be missing. */
export interface MomentRunDraft {
  readonly start: MomentDraft;
  readonly end: MomentDraft;
}

/** One half of a run: the day or the time of one of its ends. */
export interface MomentRunHalf {
  readonly part: 'day' | 'time';
  readonly position: 'start' | 'end';
}

export function momentRunDraft(value: DateTimeRangeValue | null): MomentRunDraft {
  return { start: momentDraft(value?.start ?? null), end: momentDraft(value?.end ?? null) };
}

/** The run a draft is: each end once both its halves are there; `null` for neither. */
export function momentRunOf(draft: MomentRunDraft): DateTimeRangeValue | null {
  const start = momentOf(draft.start);
  const end = momentOf(draft.end);

  return start === null && end === null ? null : { start, end };
}

export function isSameMomentRunDraft(a: MomentRunDraft, b: MomentRunDraft): boolean {
  return isSameMomentDraft(a.start, b.start) && isSameMomentDraft(a.end, b.end);
}

/** The half to choose next: what the end being edited lacks, then what the other does. */
export function missingHalf(
  draft: MomentRunDraft,
  position: 'start' | 'end',
): MomentRunHalf | null {
  for (const at of [position, position === 'start' ? 'end' : 'start'] as const) {
    if (draft[at].date === null) return { part: 'day', position: at };
    if (draft[at].time === null) return { part: 'time', position: at };
  }

  return null;
}

/** The draft with the days a grid chose. Each end keeps its time. */
export function withRunDays(
  draft: MomentRunDraft,
  days: { readonly start: PlainDate | null; readonly end: PlainDate | null },
): MomentRunDraft {
  return {
    start: { ...draft.start, date: days.start },
    end: { ...draft.end, date: days.end },
  };
}

/** Whether a grid refuses a day, by the rules and by the run open at a start. */
export function runDayRefusal(
  open: MomentDraft,
  rules: MomentRunRules,
): (date: PlainDate) => boolean {
  const moments = momentRules(rules);
  const from = open.date;
  if (from === null) return (date) => isRefusedDay(date, moments);

  const unavailable = rules.unavailableDay ?? (() => false);
  const days = { contiguous: rules.contiguous, count: 'days', unavailable } as const;
  const blocked =
    rules.contiguous === false
      ? { before: null, after: null }
      : blockedAround(from, unavailable, CONTIGUOUS_SEARCH);

  return (date) =>
    isRefusedDay(date, moments) ||
    isDateRefusedInRun(from, date, days, blocked) ||
    (compareDate(date, from) > 0 && isOutOfReach(open, date, rules));
}

/** Whether a day of a run is past the longest it may be. */
export function isPastRunLimit(
  draft: MomentRunDraft,
  date: PlainDate,
  rules: MomentRunRules,
): boolean {
  const start = momentOf(draft.start);
  if (start === null || rules.maxLength === undefined) return false;
  if (compareDate(date, start.date) <= 0) return false;

  const time = isSameDate(date, draft.end.date) ? draft.end.time : null;

  return (
    dateTimeRangeSeconds(start, { date, time: time ?? START_OF_DAY }) >
    rules.maxLength - (time === null ? 1 : 0)
  );
}

/** The times of a day that may close a run opened at `start`. */
export function closingMoments(
  start: PlainDateTime | null,
  date: PlainDate | null,
  rules: MomentRunRules,
): DayTimes {
  const times = dayTimes(date, momentRules(rules));
  if (start === null || date === null) return times;

  const { contiguous, maxLength, minLength, options, step } = rules;
  if (isSameDate(start.date, date)) {
    return closingTimes(start.time, {
      contiguous,
      max: times.max,
      maxLength,
      min: times.min,
      minLength,
      options,
      step,
      unavailable: times.isTimeUnavailable,
    });
  }

  return {
    ...times,
    isTimeUnavailable: (time) =>
      runRefusal(0, dateTimeRangeSeconds(start, { date, time }), 1, rules) ||
      times.isTimeUnavailable?.(time) === true,
  };
}

/** The run with its end one day later or earlier, when the rules take it. */
export function stepMomentRun(
  draft: MomentRunDraft,
  direction: 1 | -1,
  rules: MomentRunRules,
): MomentRunDraft | null {
  if (momentOf(draft.start) === null || draft.end.date === null) return null;

  const next = withRunDays(draft, {
    start: draft.start.date,
    end: addDays(draft.end.date, direction),
  });
  const refusal = refusalOfMoments(momentRunOf(next), rules);
  const towards = direction === -1 ? 'over' : 'short';

  return refusal === null || refusal.reason === towards ? next : null;
}

/** The run as long as a length, from its own start; `null` without one, or refused. */
export function momentRunFor(
  draft: MomentRunDraft,
  seconds: number,
  rules: MomentRunRules,
): MomentRunDraft | null {
  const start = momentOf(draft.start);
  if (start === null) return null;

  const end = addDateTimeSeconds(start, seconds);

  return refusalOfMoments({ start, end }, rules) === null ? { start, end } : null;
}

/** The first thing a run of moments fails, in the order a reader is told about it. */
export function refusalOfMoments(
  run: DateTimeRangeValue | null,
  rules: MomentRunRules,
): RunRefusal | null {
  const seconds = run?.start && run.end ? dateTimeRangeSeconds(run.start, run.end) : 0;

  return refusalOfSeconds(dateTimeRangeProblems(run, rules), seconds, rules);
}

/** Whether no time of a day makes a run of an accepted length. */
function isOutOfReach(open: MomentDraft, date: PlainDate, rules: MomentRunRules): boolean {
  const start = momentOf(open);
  if (start === null) return false;

  const { maxLength, minLength } = rules;
  const shortest = dateTimeRangeSeconds(start, { date, time: START_OF_DAY });
  const longest = dateTimeRangeSeconds(start, { date, time: END_OF_DAY });

  return (
    (maxLength !== undefined && shortest > maxLength) ||
    (minLength !== undefined && longest < minLength)
  );
}

function momentRules(rules: MomentRunRules): MomentRules {
  return {
    isDateUnavailable: rules.unavailableDay,
    isTimeUnavailable: rules.unavailableTime,
    max: rules.max,
    maxTime: rules.maxTime,
    min: rules.min,
    minTime: rules.minTime,
  };
}
