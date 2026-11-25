import { addDays, isSameDate } from './plain-date';
import type { PlainDate } from './plain-date';
import { dayWindow, isDateTimeInRange } from './plain-date-time';
import type { DayWindowOptions, PlainDateTime } from './plain-date-time';
import { isSameTime, isTimeInRange } from './plain-time';
import type { PlainTime } from './plain-time';

/** The moments a picker takes: whole bounds, the bounds of every day, and two predicates. */
export interface MomentRules extends DayWindowOptions {
  readonly isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  readonly isTimeUnavailable?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;
}

/** A moment being composed: either half may still be missing. */
export interface MomentDraft {
  readonly date: PlainDate | null;
  readonly time: PlainTime | null;
}

/** The times of one day, as a clock takes them. */
export interface DayTimes {
  readonly isTimeUnavailable: ((time: PlainTime) => boolean) | undefined;
  readonly max: PlainTime | undefined;
  readonly min: PlainTime | undefined;
}

/** How far a step of one day looks for a day the rules accept. */
const STEP_SEARCH = 366;

/** Whether a bound or a predicate refuses a moment. */
export function isRefusedMoment({ date, time }: PlainDateTime, rules: MomentRules): boolean {
  const window = dayWindow(date, rules);

  return (
    window === null ||
    !isDateTimeInRange({ date, time }, rules.min, rules.max) ||
    !isTimeInRange(time, window.earliest, window.latest) ||
    rules.isDateUnavailable?.(date) === true ||
    rules.isTimeUnavailable?.(time, date) === true
  );
}

/** Whether a whole day is refused, by a predicate or by bounds that leave it no time. */
export function isRefusedDay(date: PlainDate, rules: MomentRules): boolean {
  return dayWindow(date, rules) === null || rules.isDateUnavailable?.(date) === true;
}

/**
 * The times a day offers. A refused day offers none, and before a day is chosen
 * the bounds of every day are the only ones that hold.
 */
export function dayTimes(date: PlainDate | null, rules: MomentRules): DayTimes {
  if (date === null) {
    return { isTimeUnavailable: undefined, max: rules.maxTime, min: rules.minTime };
  }

  const window = dayWindow(date, rules);
  if (window === null || isRefusedDay(date, rules)) {
    return { isTimeUnavailable: () => true, max: undefined, min: undefined };
  }

  const refuses = rules.isTimeUnavailable;

  return {
    isTimeUnavailable: refuses === undefined ? undefined : (time) => refuses(time, date),
    max: window.latest,
    min: window.earliest,
  };
}

export function momentDraft(value: PlainDateTime | null): MomentDraft {
  return { date: value?.date ?? null, time: value?.time ?? null };
}

/** The moment a draft is, once both halves are there. */
export function momentOf({ date, time }: MomentDraft): PlainDateTime | null {
  return date === null || time === null ? null : { date, time };
}

export function isSameMomentDraft(a: MomentDraft, b: MomentDraft): boolean {
  return isSameDate(a.date, b.date) && isSameTime(a.time, b.time);
}

/** The next day either way that the rules accept, or `null` a year away. */
export function stepToDay(
  from: PlainDate,
  direction: 1 | -1,
  refuses: (date: PlainDate) => boolean,
): PlainDate | null {
  for (let count = 1; count <= STEP_SEARCH; count += 1) {
    const date = addDays(from, count * direction);
    if (!refuses(date)) return date;
  }

  return null;
}
