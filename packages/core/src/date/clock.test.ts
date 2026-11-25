import { describe, expect, it } from 'vitest';

import {
  clockColumns,
  clockModel,
  clockMove,
  clockRows,
  dayPeriod,
  slotGroups,
  withClockHour,
  withClockMinute,
  withClockSecond,
} from './clock';
import { plainTime, toISOTime } from './plain-time';
import type { PlainTime } from './plain-time';
import { timeList } from './time-list';

const t = plainTime;
const values = (units: readonly { value: number }[]) => units.map((unit) => unit.value);
const open = (units: readonly { value: number; unavailable: boolean }[]) =>
  units.filter((unit) => !unit.unavailable).map((unit) => unit.value);
const at = (time: PlainTime) => toISOTime(time, 'minute');

describe('clockModel', () => {
  it('holds the twenty-four hours whatever the bounds leave of them', () => {
    const model = clockModel({ step: 900, min: t(9), max: t(17, 30) });

    expect(values(model.hours)).toEqual(Array.from({ length: 24 }, (_, hour) => hour));
    expect(open(model.hours)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it('holds the minutes of the step', () => {
    expect(values(clockModel({ step: 900 }).minutes(14))).toEqual([0, 15, 30, 45]);
    expect(values(clockModel({ step: 300 }).minutes(14))).toHaveLength(12);
    expect(values(clockModel({ step: 60 }).minutes(14))).toHaveLength(60);
  });

  it('counts the step from the minimum, as the platform does', () => {
    const model = clockModel({ step: 1800, min: t(8, 10) });

    expect(values(model.minutes(8))).toEqual([10, 40]);
    expect(values(model.minutes(13))).toEqual([10, 40]);
    expect(open(model.hours)[0]).toBe(8);
  });

  it('stops at the maximum', () => {
    expect(values(clockModel({ step: 900, max: t(17, 30) }).minutes(17))).toEqual([0, 15, 30]);
  });

  it('refuses an hour only when every time in it is refused', () => {
    const model = clockModel({
      step: 900,
      isTimeUnavailable: (time) => time.hour === 12 || (time.hour === 13 && time.minute < 45),
    });

    expect(open(model.hours)).not.toContain(12);
    expect(open(model.hours)).toContain(13);
    expect(open(model.minutes(13))).toEqual([45]);
    expect(values(model.minutes(13))).toEqual([0, 15, 30, 45]);
  });

  it('holds one hour in every two under a step of two hours', () => {
    const model = clockModel({ step: 7200 });

    expect(open(model.hours)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    expect(values(model.minutes(2))).toEqual([0]);
  });

  it('holds the seconds of the step', () => {
    expect(values(clockModel({ step: 15 }).seconds(14, 30))).toEqual([0, 15, 30, 45]);
    expect(values(clockModel({ step: 900 }).seconds(14, 30))).toEqual([0]);
  });

  it('holds nothing under a step that is not one, or bounds that cross', () => {
    expect(open(clockModel({ step: 0 }).hours)).toEqual([]);
    expect(open(clockModel({ step: 900, min: t(10), max: t(9) }).hours)).toEqual([]);
  });
});

describe('choosing in a clock', () => {
  const model = clockModel({ step: 900 });
  const busy = clockModel({
    step: 900,
    isTimeUnavailable: (time) => time.hour === 9 && time.minute === 30,
  });

  it('keeps the minutes when the hour changes', () => {
    expect(at(withClockHour(model, t(14, 30), 9)!)).toBe('09:30');
  });

  it('takes the nearest accepted minute, the earlier one on a tie', () => {
    expect(at(withClockHour(busy, t(14, 30), 9)!)).toBe('09:15');
    expect(at(withClockHour(model, t(10, 20), 11)!)).toBe('11:15');
  });

  it('takes the first accepted minute when nothing is held', () => {
    expect(at(withClockHour(model, null, 9)!)).toBe('09:00');
    expect(at(withClockHour(clockModel({ step: 1800, min: t(8, 10) }), null, 8)!)).toBe('08:10');
  });

  it('answers nothing for an hour with no accepted time', () => {
    expect(withClockHour(clockModel({ step: 900, min: t(9) }), t(14), 3)).toBeNull();
  });

  it('keeps the hour when the minute changes, and the minute when the second does', () => {
    expect(at(withClockMinute(model, t(14, 30), 45)!)).toBe('14:45');
    expect(withClockMinute(busy, t(9, 0), 30)).toBeNull();
    expect(withClockSecond(clockModel({ step: 15 }), t(14, 30, 0), 45)).toEqual(t(14, 30, 45));
  });

  it('keeps the seconds when the minute changes', () => {
    expect(withClockMinute(clockModel({ step: 15 }), t(14, 30, 45), 31)).toEqual(t(14, 31, 45));
  });
});

describe('the shape of a clock', () => {
  it('draws four, six or ten units across', () => {
    expect([1, 4, 6, 12, 20, 60].map(clockColumns)).toEqual([4, 4, 6, 6, 10, 10]);
  });

  it('cuts the day into four periods', () => {
    expect([0, 5, 6, 11, 12, 17, 18, 23].map(dayPeriod)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('groups whole times by period, and draws no empty group', () => {
    const list = timeList({ step: 900, options: [t(9), t(9, 20), t(13, 45)] });

    expect(
      slotGroups(list).map((group) => [
        group.period,
        group.options.map((option) => at(option.time)),
      ]),
    ).toEqual([
      [1, ['09:00', '09:20']],
      [2, ['13:45']],
    ]);
  });
});

describe('moving in a clock', () => {
  const hours = clockRows([6, 6, 6, 6], 6);
  const slots = clockRows([5, 2], 3);

  it('starts every group on a row of its own', () => {
    expect(hours).toEqual([6, 6, 6, 6]);
    expect(slots).toEqual([3, 2, 2]);
    expect(clockRows([60], 10)).toHaveLength(6);
  });

  it('steps along the cells and holds the edges', () => {
    expect(clockMove(hours, 5, 'next')).toBe(6);
    expect(clockMove(hours, 0, 'previous')).toBe(0);
    expect(clockMove(hours, 23, 'next')).toBe(23);
  });

  it('keeps the column from row to row', () => {
    expect(clockMove(hours, 14, 'up')).toBe(8);
    expect(clockMove(hours, 14, 'down')).toBe(20);
    expect(clockMove(hours, 2, 'up')).toBe(2);
    expect(clockMove(hours, 14, 'firstRow')).toBe(2);
    expect(clockMove(hours, 2, 'lastRow')).toBe(20);
  });

  it('takes the last cell of a shorter row', () => {
    expect(clockMove(slots, 2, 'down')).toBe(4);
    expect(clockMove(slots, 4, 'down')).toBe(6);
  });

  it('reaches the two ends of a row', () => {
    expect(clockMove(hours, 14, 'rowStart')).toBe(12);
    expect(clockMove(hours, 14, 'rowEnd')).toBe(17);
  });
});
