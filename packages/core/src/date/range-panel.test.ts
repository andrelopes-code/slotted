import { describe, expect, it } from 'vitest';

import { plainDate } from './plain-date';
import { isPastLimit, lengthOf, refusalOf, stepRun } from './range-panel';

const d = (day: number) => plainDate(2026, 9, day);
const run = (start: number, end: number) => ({ start: d(start), end: d(end) });
const stay = { count: 'nights', maxLength: 7, minLength: 2 } as const;

describe('a step of the end', () => {
  it('moves it one day inside the limits', () => {
    expect(stepRun(run(1, 5), 1, stay)).toEqual(run(1, 6));
    expect(stepRun(run(1, 5), -1, stay)).toEqual(run(1, 4));
    expect(stepRun(run(1, 8), 1, stay)).toBeNull();
    expect(stepRun(run(1, 3), -1, stay)).toBeNull();
  });

  it('shortens a run that is already over, one day at a time', () => {
    expect(stepRun(run(1, 12), -1, stay)).toEqual(run(1, 11));
    expect(stepRun(run(1, 12), 1, stay)).toBeNull();
  });

  it('keeps one day, or one night, when no shortest run is stated', () => {
    expect(stepRun(run(1, 2), -1, { count: 'nights' })).toBeNull();
    expect(stepRun(run(1, 2), -1, { count: 'days' })).toEqual(run(1, 1));
  });

  it('stops at a bound, and before an unavailable day', () => {
    expect(stepRun(run(1, 5), 1, { count: 'days', max: d(5) })).toBeNull();
    expect(
      stepRun(run(1, 5), 1, { count: 'days', unavailable: (date) => date.day === 6 }),
    ).toBeNull();
  });

  it('answers nothing for a run still open', () => {
    expect(stepRun({ start: d(1), end: null }, 1, stay)).toBeNull();
  });
});

describe('a run past its limit', () => {
  it('names the days over it', () => {
    const over = [...Array(12).keys()].filter((day) => isPastLimit(run(1, 12), d(day + 1), stay));

    expect(over.map((day) => day + 1)).toEqual([9, 10, 11, 12]);
    expect(isPastLimit(run(1, 12), d(12), { count: 'nights' })).toBe(false);
  });

  it('says why a run is refused, and by how much', () => {
    expect(refusalOf(run(1, 12), stay)).toEqual({ by: 4, reason: 'over' });
    expect(refusalOf(run(1, 2), stay)).toEqual({ by: 1, reason: 'short' });
    expect(refusalOf(run(5, 1), stay)).toEqual({ reason: 'order' });
    expect(refusalOf(run(1, 5), { ...stay, min: d(2) })).toEqual({ reason: 'bounds' });
    expect(refusalOf(run(1, 5), { ...stay, unavailable: (date) => date.day === 3 })).toEqual({
      reason: 'unavailable',
    });
    expect(refusalOf(run(1, 5), stay)).toBeNull();
  });
});

it('counts a whole run in order, and nothing else', () => {
  expect(lengthOf(run(1, 5), stay)).toBe(4);
  expect(lengthOf(run(5, 1), stay)).toBe(0);
  expect(lengthOf(null, stay)).toBe(0);
});
