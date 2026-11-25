import { describe, expect, it } from 'vitest';

import { clockModel } from './clock';
import { clockHourGroups, clockSlotGroups, clockStop, clockUnitCells } from './clock-view';
import type { ClockCell } from './clock-view';
import { plainTime } from './plain-time';
import { createTimeFormat } from './time-format';
import { timeList } from './time-list';

const periods = ['Night', 'Morning', 'Afternoon', 'Evening'] as const;
const day = createTimeFormat({ locale: 'en-US', hourCycle: 24 });
const halves = createTimeFormat({ locale: 'en-US', hourCycle: 12 });
const model = clockModel({ step: 900, min: plainTime(9) });

describe('clockHourGroups', () => {
  it('names the parts of a twenty-four hour day, six hours under each', () => {
    const groups = clockHourGroups({ format: day, held: null, model, periods });

    expect(groups.map((group) => group.label)).toEqual(periods);
    expect(groups[1]?.cells.map((cell) => cell.label)).toEqual([
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
    ]);
    expect(groups[1]?.cells[0]?.name).toBeUndefined();
  });

  it('writes the half once for its two rows, and names every hour whole', () => {
    const groups = clockHourGroups({ format: halves, held: null, model, periods });

    expect(groups.map((group) => group.label)).toEqual(['AM', '', 'PM', '']);
    expect(groups.map((group) => group.name)).toEqual(['AM', 'AM', 'PM', 'PM']);
    expect(groups[2]?.cells.map((cell) => cell.label)).toEqual(['12', '1', '2', '3', '4', '5']);
    expect(groups[2]?.cells[2]?.name).toBe('02 PM');
  });

  it('marks the hour held, the hour it is and the hours refused', () => {
    const cells = clockHourGroups({
      format: day,
      held: plainTime(14, 30),
      model,
      now: plainTime(10, 20),
      periods,
    }).flatMap((group) => group.cells);

    expect(cells.filter((cell) => cell.selected).map((cell) => cell.value)).toEqual([14]);
    expect(cells.filter((cell) => cell.now).map((cell) => cell.value)).toEqual([10]);
    expect(cells.filter((cell) => cell.unavailable)).toHaveLength(9);
  });
});

describe('the cells of a minute and of a stated list', () => {
  it('writes the minutes after their colon', () => {
    const cells = clockUnitCells(model.minutes(14), 30, day);

    expect(cells.map((cell) => cell.label)).toEqual([':00', ':15', ':30', ':45']);
    expect(cells.map((cell) => cell.selected)).toEqual([false, false, true, false]);
  });

  it('writes whole times under the part of the day', () => {
    const list = timeList({ step: 900, options: [plainTime(9, 20), plainTime(13, 45)] });
    const groups = clockSlotGroups(list, plainTime(9, 20), day, periods);

    expect(groups.map((group) => [group.label, group.cells[0]?.label])).toEqual([
      ['Morning', '09:20'],
      ['Afternoon', '13:45'],
    ]);
    expect(groups[0]?.cells[0]).toMatchObject({ selected: true, time: plainTime(9, 20) });
  });
});

describe('clockStop', () => {
  const cell = (over: Partial<ClockCell>): ClockCell => ({
    value: 0,
    label: '',
    now: false,
    selected: false,
    unavailable: false,
    ...over,
  });

  it('is the chosen cell, then the hour it is, then the first on offer', () => {
    expect(clockStop([cell({}), cell({ now: true }), cell({ selected: true })])).toBe(2);
    expect(clockStop([cell({}), cell({ now: true })])).toBe(1);
    expect(
      clockStop([cell({ unavailable: true }), cell({ now: true, unavailable: true }), cell({})]),
    ).toBe(2);
    expect(clockStop([cell({ unavailable: true })])).toBe(0);
  });
});
