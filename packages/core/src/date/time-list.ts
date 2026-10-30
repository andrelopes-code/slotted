/**
 * The times a panel offers, and the values each of its columns holds.
 *
 * A list of times at a step has one axis, which is why the panel behind
 * `time-picker` is a listbox rather than a grid. Everything here is arithmetic
 * over a step in seconds — the unit the platform states `input[type=time]`'s
 * own step in — so an interval string, three per-unit numbers and a set of
 * views all reduce to one number the family never has to translate twice.
 *
 * Nothing here touches the DOM or a framework.
 */

import { isTimeInRange, secondsOfDay, SECONDS_PER_DAY, timeOfSeconds } from './plain-time';
import type { PlainTime } from './plain-time';

export interface TimeOption {
  readonly time: PlainTime;
  /** A bound or the predicate refuses it. It is still drawn, unless the family hides it. */
  readonly unavailable: boolean;
}

export interface TimeListOptions {
  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step: number;
  /**
   * The times to offer, stated rather than stepped.
   *
   * A step describes a regular list, and a great many real ones are not: a
   * clinic open at 09:00, 09:20 and 13:45, a broadcast schedule, a set of
   * second-level marks. `isTimeUnavailable` can only subtract from a stepped
   * list, so it reaches none of those. This is the one prop that makes every
   * arrangement expressible, and it is why the panel needs no second shape.
   */
  readonly options?: readonly PlainTime[] | undefined;
  readonly min?: PlainTime | undefined;
  readonly max?: PlainTime | undefined;
  readonly isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;
  /** How many rows the list may reach. Defaults to `MAX_OPTIONS`. */
  readonly maxOptions?: number | undefined;
}

/** One hour's worth of the list, and the hour it holds. */
export interface TimeGroup {
  readonly hour: number;
  readonly options: readonly TimeOption[];
}

/**
 * How long a list may get.
 *
 * The guard belongs on the length and not on the step: a thirty-second step
 * inside a five-minute window is eleven rows and perfectly sensible, and a
 * floor under the step refused that window along with the day it was aimed at.
 *
 * 1440 is a whole day at a one-minute step — the finest whole-day list any
 * surveyed implementation offers, and a number a browser lays out without
 * complaint. A day at a one-second step is 86 400 and is a configuration
 * mistake rather than a list; it is cut here rather than handed to the DOM.
 * A consumer who means it raises `maxOptions` and owns the consequence.
 */
export const MAX_OPTIONS = 1440;

/**
 * Every time the panel offers, in order.
 *
 * The base a step counts from is `min` when it is stated and midnight when it
 * is not, which is the platform's own rule and one no surveyed panel states.
 * The list never runs past the end of the day: a time has no day beside it, so
 * there is no second day to run into.
 */
export function timeList(options: TimeListOptions): TimeOption[] {
  const cap = Math.max(0, Math.trunc(options.maxOptions ?? MAX_OPTIONS));
  const mark = (time: PlainTime): TimeOption => ({
    time,
    unavailable:
      !isTimeInRange(time, options.min, options.max) || options.isTimeUnavailable?.(time) === true,
  });

  /* A stated list is offered as it stands: the order is the consumer's, the
     bounds and the predicate still speak, and the step says nothing. */
  if (options.options !== undefined) return options.options.slice(0, cap).map(mark);

  const step = Math.trunc(options.step);
  if (step < 1) return [];

  const from = options.min === undefined ? 0 : secondsOfDay(options.min);
  const to = options.max === undefined ? SECONDS_PER_DAY - 1 : secondsOfDay(options.max);
  if (to < from) return [];

  const list: TimeOption[] = [];
  for (let at = from; at <= to && list.length < cap; at += step) list.push(mark(timeOfSeconds(at)));
  return list;
}

/** Whether a list stops short of the times its own configuration asked for. */
export function isTruncated(options: TimeListOptions): boolean {
  const cap = Math.max(0, Math.trunc(options.maxOptions ?? MAX_OPTIONS));
  if (options.options !== undefined) return options.options.length > cap;

  const step = Math.trunc(options.step);
  if (step < 1) return false;
  const from = options.min === undefined ? 0 : secondsOfDay(options.min);
  const to = options.max === undefined ? SECONDS_PER_DAY - 1 : secondsOfDay(options.max);
  return to >= from && Math.floor((to - from) / step) + 1 > cap;
}

/**
 * Which option a time is closest to, so the panel opens where the reader
 * already is. `-1` when there is nothing to open onto.
 */
export function nearestIndex(list: readonly TimeOption[], time: PlainTime): number {
  if (list.length === 0) return -1;
  const wanted = secondsOfDay(time);

  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  list.forEach((option, index) => {
    const away = Math.abs(secondsOfDay(option.time) - wanted);
    if (away < distance) {
      best = index;
      distance = away;
    }
  });
  return best;
}

/**
 * The list cut into hours, in order.
 *
 * Not a shape the panel draws — an hour heading was drawn and withdrawn,
 * because the hour is already on every row. This is what `PageUp` and
 * `PageDown` move by: the coarse axis a reader navigates by, spending a key
 * rather than a row of the list on it.
 */
export function groupByHour(list: readonly TimeOption[]): TimeGroup[] {
  const groups: TimeGroup[] = [];
  for (const option of list) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.hour === option.time.hour) {
      (last.options as TimeOption[]).push(option);
      continue;
    }
    groups.push({ hour: option.time.hour, options: [option] });
  }
  return groups;
}

/**
 * Where `PageUp` and `PageDown` land: the next hour boundary in that direction.
 *
 * Going back from the middle of an hour lands on the top of that hour, and
 * only a second press leaves it — which is how a reader reads the key ("back
 * to the start of nine"), and what makes the two directions symmetrical: each
 * press crosses exactly one boundary. Clamped at both ends, so a page at the
 * top of the list stays at the top rather than wrapping into another day.
 */
export function hourJump(list: readonly TimeOption[], from: number, direction: 1 | -1): number {
  if (list.length === 0) return -1;

  const starts = groupByHour(list).map((group) => list.indexOf(group.options[0] as TimeOption));
  /* `findLastIndex` is ES2023 and this package targets earlier; the walk back
     is three lines and needs no library bump for one call. */
  let current = 0;
  for (let index = 0; index < starts.length; index += 1) {
    if ((starts[index] as number) <= from) current = index;
  }

  if (direction === -1) {
    const start = starts[current] ?? 0;
    if (from > start) return start;
    return starts[current - 1] ?? 0;
  }

  return starts[current + 1] ?? list.length - 1;
}
