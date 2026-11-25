/**
 * The arithmetic of a run of times a panel composes: which times close it, how
 * far a step may take its end, and what it is refused for.
 */

import type { DayTimes } from './moment';
import { addSeconds, secondsOfDay, SECONDS_PER_DAY } from './plain-time';
import type { PlainTime } from './plain-time';
import type { RunRefusal } from './range-panel';
import { nearestIndex, timeList } from './time-list';
import {
  firstUnavailableIndex,
  runRefusal,
  timeRangeProblems,
  timeRangeSeconds,
} from './time-range';
import type { RangeProblem, RunLengthRules, TimeRangeRules, TimeRangeValue } from './time-range';

/** The rules of a run of times, and the list its ends are offered from. */
export interface TimeRunRules extends TimeRangeRules {
  /** Whether the run may cross an unavailable time. On by default. */
  readonly contiguous?: boolean | undefined;
  readonly options?: readonly PlainTime[] | undefined;
  readonly step: number;
}

/**
 * The times that may close a run opened at `start`: after it, inside the
 * limits, and with `contiguous` before the first unavailable time past it.
 */
export function closingTimes(start: PlainTime | null, rules: TimeRunRules): DayTimes {
  const { max, min, unavailable } = rules;
  if (start === null) return { isTimeUnavailable: unavailable, max, min };

  const from = secondsOfDay(start);
  const wall = wallAfter(start, rules);

  return {
    isTimeUnavailable: (time) => {
      const at = secondsOfDay(time);

      return (
        at === from || at >= wall || runRefusal(from, at, 1, rules) || unavailable?.(time) === true
      );
    },
    max,
    min,
  };
}

/** The run with its end one step later or earlier, when the rules take it. */
export function stepTimeRun(
  run: TimeRangeValue,
  direction: 1 | -1,
  rules: TimeRunRules,
): TimeRangeValue | null {
  if (run.start === null || run.end === null) return null;

  const { days, time } = addSeconds(run.end, rules.step * direction);
  if (days !== 0) return null;

  return acceptedStep({ start: run.start, end: time }, direction, rules);
}

/** The run as long as a length, from its own start; `null` past midnight or refused. */
export function timeRunOf(
  start: PlainTime | null,
  seconds: number,
  rules: TimeRunRules,
): TimeRangeValue | null {
  if (start === null || secondsOfDay(start) + seconds >= SECONDS_PER_DAY) return null;

  const run = { start, end: addSeconds(start, seconds).time };

  return timeRangeProblems(run, rules).length === 0 ? run : null;
}

/** The first thing a run of times fails, in the order a reader is told about it. */
export function refusalOfTimes(run: TimeRangeValue | null, rules: TimeRunRules): RunRefusal | null {
  const problems = timeRangeProblems(run, rules);
  const seconds = run?.start && run.end ? timeRangeSeconds(run.start, run.end) : 0;

  return refusalOfSeconds(problems, seconds, rules);
}

/** The first problem of a run counted in seconds, and by how much when it is its length. */
export function refusalOfSeconds(
  [problem]: readonly RangeProblem[],
  seconds: number,
  { maxLength, minLength }: RunLengthRules,
): RunRefusal | null {
  if (problem === undefined) return null;
  if (problem === 'order' || problem === 'unavailable') return { reason: problem };
  if (problem !== 'length') return { reason: 'bounds' };

  return maxLength !== undefined && seconds > maxLength
    ? { by: seconds - maxLength, reason: 'over' }
    : { by: (minLength ?? seconds) - seconds, reason: 'short' };
}

/** A step is taken when the rules take it, and towards the limit from outside it. */
function acceptedStep(
  run: TimeRangeValue,
  direction: 1 | -1,
  rules: TimeRunRules,
): TimeRangeValue | null {
  const refusal = refusalOfTimes(run, rules);
  const towards = direction === -1 ? 'over' : 'short';

  return refusal === null || refusal.reason === towards ? run : null;
}

/** Where an unavailable time stops a contiguous run, in seconds of the day. */
function wallAfter(start: PlainTime, rules: TimeRunRules): number {
  if (rules.contiguous === false || rules.unavailable === undefined) return SECONDS_PER_DAY;

  const list = timeList({
    isTimeUnavailable: rules.unavailable,
    max: rules.max,
    min: rules.min,
    options: rules.options,
    step: rules.step,
  });
  const wall = list[firstUnavailableIndex(list, nearestIndex(list, start), 1)];

  return wall === undefined ? SECONDS_PER_DAY : secondsOfDay(wall.time);
}
