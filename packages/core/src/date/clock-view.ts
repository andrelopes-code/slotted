/**
 * What a clock draws: the cells of each grid with their words, and the one the
 * reader is brought to. Both bindings render the same groups, so the words and
 * the marks are decided once.
 */

import { slotGroups } from './clock';
import type { ClockModel, ClockPeriod, ClockUnit } from './clock';
import { isSameTime, plainTime } from './plain-time';
import type { PlainTime } from './plain-time';
import { createTimeFormat } from './time-format';
import type { TimeFormat } from './time-format';
import type { TimeOption } from './time-list';

/** The four names of a twenty-four hour day: night, morning, afternoon, evening. */
export type ClockPeriodNames = readonly [string, string, string, string];

/** One hour, minute, second or whole time. */
export interface ClockCell {
  /** The hour, the minute or the second; the seconds of the day of a whole time. */
  readonly value: number;
  readonly label: string;
  /** Said in place of the label, where the label alone names two hours. */
  readonly name?: string | undefined;
  /** The whole time of a slot. */
  readonly time?: PlainTime | undefined;
  readonly now: boolean;
  readonly selected: boolean;
  readonly unavailable: boolean;
}

/** A row of cells, or several, under one name. */
export interface ClockGroup {
  /** What the label column draws; a second row under one name draws nothing. */
  readonly label: string;
  /** What assistive technology is told, on every row. */
  readonly name: string;
  readonly cells: readonly ClockCell[];
}

export interface ClockHoursOptions {
  readonly model: ClockModel;
  readonly format: TimeFormat;
  readonly held: PlainTime | null;
  readonly now?: PlainTime | undefined;
  readonly periods: ClockPeriodNames;
}

const PERIODS: readonly ClockPeriod[] = [0, 1, 2, 3];

/** The twenty-four hours, six to a row. */
export function clockHourGroups(options: ClockHoursOptions): ClockGroup[] {
  const { format, model, periods } = options;
  const halves = format.usesDayPeriod ? format.dayPeriodNames() : null;

  return PERIODS.map((period) => ({
    label: halves === null ? periods[period] : period % 2 === 0 ? halveOf(halves, period) : '',
    name: halves === null ? periods[period] : halveOf(halves, period),
    cells: model.hours
      .slice(period * 6, period * 6 + 6)
      .map((unit) => hourCell(unit, options, halves !== null)),
  }));
}

/** The minutes or the seconds, as one group. */
export function clockUnitCells(
  units: readonly ClockUnit[],
  selected: number | null,
  format: TimeFormat,
): ClockCell[] {
  return units.map(({ unavailable, value }) => ({
    value,
    label: `:${format.formatValue(value, 'minute')}`,
    now: false,
    selected: value === selected,
    unavailable,
  }));
}

/** A stated list of times, under the part of the day each one is in. */
export function clockSlotGroups(
  list: readonly TimeOption[],
  held: PlainTime | null,
  format: TimeFormat,
  periods: ClockPeriodNames,
): ClockGroup[] {
  return slotGroups(list).map(({ options, period }) => ({
    label: periods[period],
    name: periods[period],
    cells: options.map(({ time, unavailable }) => ({
      value: time.hour * 3600 + time.minute * 60 + time.second,
      label: format.format(time),
      time,
      now: false,
      selected: isSameTime(time, held),
      unavailable,
    })),
  }));
}

/** Where the one tab stop of a grid is: the chosen cell, the hour it is, or the first on offer. */
export function clockStop(cells: readonly ClockCell[]): number {
  const found = [
    cells.findIndex((cell) => cell.selected),
    cells.findIndex((cell) => cell.now && !cell.unavailable),
    cells.findIndex((cell) => !cell.unavailable),
  ].find((index) => index >= 0);

  return found ?? 0;
}

function halveOf(halves: readonly [string, string], period: ClockPeriod): string {
  return period < 2 ? halves[0] : halves[1];
}

function hourCell(unit: ClockUnit, options: ClockHoursOptions, halved: boolean): ClockCell {
  const { format, held, now } = options;

  return {
    value: unit.value,
    label: halved ? shortHour(unit.value, format) : format.formatValue(unit.value, 'hour'),
    name: halved ? hourName(unit.value, format) : undefined,
    now: now?.hour === unit.value,
    selected: held?.hour === unit.value,
    unavailable: unit.unavailable,
  };
}

/** "2" rather than "02": a twelve-hour clock writes no leading zero. */
function shortHour(hour: number, format: TimeFormat): string {
  return String(format.toDisplay(hour).hour)
    .split('')
    .map((digit) => format.digits[Number(digit)] ?? digit)
    .join('');
}

/** "2 PM", in the order the locale writes the two. */
function hourName(hour: number, format: TimeFormat): string {
  return createTimeFormat({ locale: format.locale, hourCycle: 12, granularity: 'hour' }).format(
    plainTime(hour),
  );
}
