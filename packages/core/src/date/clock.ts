/**
 * The hours, minutes and seconds a clock draws, and the time a press in one of
 * them writes.
 *
 * A clock holds the same arithmetic as `time-list` — a step in seconds counted
 * from the minimum — cut by unit rather than written out, so a step of one
 * second costs a press the sixty seconds of a minute and never the 86 400 of a
 * day.
 *
 * Nothing here touches the DOM or a framework.
 */

import { isTimeInRange, secondsOfDay, SECONDS_PER_DAY, timeOfSeconds } from './plain-time';
import type { PlainTime } from './plain-time';
import type { TimeOption } from './time-list';

const MINUTE = 60;
const HOUR = 3600;

export interface ClockRules {
  /** Seconds between two offered times, counted from `min`, or from midnight. */
  readonly step: number;
  readonly min?: PlainTime | undefined;
  readonly max?: PlainTime | undefined;
  readonly isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;
}

/** One hour, minute or second: drawn always, and refused when no accepted time is in it. */
export interface ClockUnit {
  readonly value: number;
  readonly unavailable: boolean;
}

export interface ClockModel {
  /** The twenty-four hours, in order. */
  readonly hours: readonly ClockUnit[];
  /** The minutes the step leaves in an hour. */
  minutes(hour: number): readonly ClockUnit[];
  /** The seconds the step leaves in a minute. */
  seconds(hour: number, minute: number): readonly ClockUnit[];
  /** The accepted time closest to one, inside `[from, to)` in seconds of the day. */
  nearest(time: PlainTime, from?: number, to?: number): PlainTime | null;
}

/** The part of the day an hour is in: night, morning, afternoon, evening. */
export type ClockPeriod = 0 | 1 | 2 | 3;

/** Whole times of one part of the day. */
export interface SlotGroup {
  readonly period: ClockPeriod;
  readonly options: readonly TimeOption[];
}

export function clockModel(rules: ClockRules): ClockModel {
  const accepted = (at: number) => {
    const time = timeOfSeconds(at);

    return isTimeInRange(time, rules.min, rules.max) && rules.isTimeUnavailable?.(time) !== true;
  };

  const unit = (value: number, from: number, size: number): ClockUnit => ({
    value,
    unavailable: !steps(rules, from, from + size).some(accepted),
  });

  return {
    hours: Array.from({ length: 24 }, (_, hour) => unit(hour, hour * HOUR, HOUR)),
    minutes: (hour) =>
      unitsIn(steps(rules, hour * HOUR, (hour + 1) * HOUR), hour * HOUR, MINUTE).map((minute) =>
        unit(minute, hour * HOUR + minute * MINUTE, MINUTE),
      ),
    seconds: (hour, minute) => {
      const from = hour * HOUR + minute * MINUTE;

      return unitsIn(steps(rules, from, from + MINUTE), from, 1).map((second) =>
        unit(second, from + second, 1),
      );
    },
    nearest: (time, from = 0, to = SECONDS_PER_DAY) => {
      const wanted = secondsOfDay(time);
      const found = steps(rules, from, to)
        .filter(accepted)
        .reduce<number | null>(
          (best, at) =>
            best === null || Math.abs(at - wanted) < Math.abs(best - wanted) ? at : best,
          null,
        );

      return found === null ? null : timeOfSeconds(found);
    },
  };
}

/**
 * The time a press on an hour writes: the minutes held stay, and a minute the
 * new hour refuses gives way to the nearest one it accepts. With nothing held
 * it is the first accepted time of the hour.
 */
export function withClockHour(
  model: ClockModel,
  held: PlainTime | null,
  hour: number,
): PlainTime | null {
  const wanted = { hour, minute: held?.minute ?? 0, second: held?.second ?? 0 };

  return model.nearest(wanted, hour * HOUR, (hour + 1) * HOUR);
}

/** The time a press on a minute writes: the hour stays, and the second when it is accepted. */
export function withClockMinute(
  model: ClockModel,
  held: PlainTime,
  minute: number,
): PlainTime | null {
  const from = held.hour * HOUR + minute * MINUTE;

  return model.nearest({ ...held, minute }, from, from + MINUTE);
}

/** The time a press on a second writes. */
export function withClockSecond(
  model: ClockModel,
  held: PlainTime,
  second: number,
): PlainTime | null {
  const at = held.hour * HOUR + held.minute * MINUTE + second;

  return model.nearest({ ...held, second }, at, at + 1);
}

/** How many units stand side by side: a quarter of an hour, five minutes, one minute. */
export function clockColumns(count: number): 4 | 6 | 10 {
  if (count <= 4) return 4;

  return count <= 12 ? 6 : 10;
}

export function dayPeriod(hour: number): ClockPeriod {
  return Math.floor(hour / 6) as ClockPeriod;
}

/** A stated list of times, cut by the part of the day each one is in. */
export function slotGroups(list: readonly TimeOption[]): SlotGroup[] {
  return ([0, 1, 2, 3] as const)
    .map((period) => ({
      period,
      options: list.filter((option) => dayPeriod(option.time.hour) === period),
    }))
    .filter((group) => group.options.length > 0);
}

/** The steps inside `[from, to)`, in seconds of the day. */
function steps(rules: ClockRules, from: number, to: number): number[] {
  const step = Math.trunc(rules.step);
  if (step < 1) return [];

  const base = rules.min === undefined ? 0 : secondsOfDay(rules.min);
  const last = rules.max === undefined ? SECONDS_PER_DAY - 1 : secondsOfDay(rules.max);
  const first = base + Math.max(0, Math.ceil((from - base) / step)) * step;
  const found: number[] = [];
  for (let at = first; at < to && at <= last; at += step) found.push(at);

  return found;
}

/** The distinct units a run of steps touches, counted from the start of the run. */
function unitsIn(run: readonly number[], from: number, size: number): number[] {
  return [...new Set(run.map((at) => Math.floor((at - from) / size)))];
}
