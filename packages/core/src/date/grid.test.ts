import { describe, expect, it } from 'vitest';

import { monthGrid, plainDate, visibleMonths, yearPage } from './index';
import type { CalendarWeek } from './index';

const iso = (weeks: CalendarWeek[]) =>
  weeks.map((week) => week.days.map((day) => day.date.day).join(' '));

describe('monthGrid', () => {
  /**
   * September 2026 opens on a Tuesday and holds 30 days, so a week starting on
   * Sunday needs five rows and spills two days of August into the first.
   */
  it('fills the first and last rows with the months either side', () => {
    const weeks = monthGrid({ year: 2026, month: 9, firstDayOfWeek: 0 });
    expect(weeks).toHaveLength(5);
    expect(iso(weeks)[0]).toBe('30 31 1 2 3 4 5');
    expect(weeks[0]?.days[0]?.outsideMonth).toBe(true);
    expect(weeks[0]?.days[2]?.outsideMonth).toBe(false);
    expect(iso(weeks)[4]).toBe('27 28 29 30 1 2 3');
  });

  it('starts the row on the day the locale starts its week on', () => {
    const monday = monthGrid({ year: 2026, month: 9, firstDayOfWeek: 1 });
    expect(iso(monday)[0]).toBe('31 1 2 3 4 5 6');
  });

  /**
   * A popover that grows a row between one press of "next" and the next moves
   * the target the reader was aiming at, so the grid inside one is fixed.
   */
  it('draws six rows on request, whatever the month needs', () => {
    expect(monthGrid({ year: 2026, month: 9, firstDayOfWeek: 0, fixedWeeks: true })).toHaveLength(
      6,
    );
    expect(monthGrid({ year: 2026, month: 2, firstDayOfWeek: 0, fixedWeeks: true })).toHaveLength(
      6,
    );
  });

  it('gives February 2026 exactly four rows when it is not fixed', () => {
    /* 1 February 2026 is a Sunday and the month holds 28 days: four whole
       weeks and not one cell of another month. */
    const weeks = monthGrid({ year: 2026, month: 2, firstDayOfWeek: 0 });
    expect(weeks).toHaveLength(4);
    expect(weeks.every((week) => week.days.every((day) => !day.outsideMonth))).toBe(true);
  });

  it('numbers every row by the ISO week its first day belongs to', () => {
    const weeks = monthGrid({ year: 2026, month: 9, firstDayOfWeek: 1 });
    expect(weeks.map((week) => week.weekNumber)).toEqual([36, 37, 38, 39, 40]);
  });

  it('holds seven days in every row, in every month of a leap year', () => {
    for (let month = 1; month <= 12; month += 1) {
      const weeks = monthGrid({ year: 2024, month, firstDayOfWeek: 0 });
      expect(weeks.every((week) => week.days.length === 7)).toBe(true);
    }
    const february = monthGrid({ year: 2024, month: 2, firstDayOfWeek: 0 });
    expect(february.flatMap((week) => week.days).some((day) => day.date.day === 29)).toBe(true);
  });
});

describe('the pages either side of the day view', () => {
  it('lists the months a multi-month calendar shows, across a year boundary', () => {
    expect(visibleMonths(plainDate(2026, 11, 1), 3)).toEqual([
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
    ]);
  });

  /**
   * The page is anchored rather than centred, so the year the reader is on
   * keeps its cell between one press and the next.
   */
  it('anchors the year page so a cell does not move under the pointer', () => {
    expect(yearPage(2026)).toEqual([
      2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027,
    ]);
    expect(yearPage(2027)).toEqual(yearPage(2026));
    expect(yearPage(2028)[0]).toBe(2028);
  });
});
