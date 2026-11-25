import { describe, expect, it } from 'vitest';

import { plainTime as t } from './plain-time';
import { closingTimes, refusalOfTimes, stepTimeRun, timeRunOf } from './time-run';
import type { TimeRunRules } from './time-run';

const HOUR = 3600;
const RULES: TimeRunRules = { maxLength: 4 * HOUR, minLength: HOUR / 2, step: 900 };
const NINE = t(9);

describe('the times that close a run', () => {
  it('come after its start, inside the limits', () => {
    const { isTimeUnavailable: refuses } = closingTimes(NINE, RULES);

    expect(
      [t(8), t(9), t(9, 15), t(9, 30), t(13), t(13, 15)].map((time) => refuses?.(time)),
    ).toEqual([true, true, true, false, false, true]);
  });

  it('stop at an unavailable time, unless the run may cross it', () => {
    const rules = { step: 900, unavailable: ({ hour }: { hour: number }) => hour === 12 };
    const refuses = (given: TimeRunRules) => closingTimes(NINE, given).isTimeUnavailable?.(t(14));

    expect(refuses(rules)).toBe(true);
    expect(refuses({ ...rules, contiguous: false })).toBe(false);
  });

  it('are the ones of the day before a start is chosen', () => {
    expect(closingTimes(null, { ...RULES, max: t(18), min: t(8) })).toEqual({
      isTimeUnavailable: undefined,
      max: t(18),
      min: t(8),
    });
  });
});

describe('a step of the end', () => {
  it('is one step of the clock', () => {
    expect(stepTimeRun({ start: NINE, end: t(10) }, 1, RULES)?.end).toEqual(t(10, 15));
    expect(stepTimeRun({ start: NINE, end: t(10) }, -1, RULES)?.end).toEqual(t(9, 45));
  });

  it('stops at the limits, and comes back from outside them', () => {
    expect(stepTimeRun({ start: NINE, end: t(13) }, 1, RULES)).toBeNull();
    expect(stepTimeRun({ start: NINE, end: t(9, 30) }, -1, RULES)).toBeNull();
    expect(stepTimeRun({ start: NINE, end: t(15) }, -1, RULES)?.end).toEqual(t(14, 45));
    expect(stepTimeRun({ start: NINE, end: t(9) }, 1, RULES)?.end).toEqual(t(9, 15));
  });

  it('stays inside the day, and needs both ends', () => {
    expect(stepTimeRun({ start: t(22), end: t(23, 45) }, 1, RULES)).toBeNull();
    expect(stepTimeRun({ start: NINE, end: null }, 1, RULES)).toBeNull();
  });
});

describe('a run of a length', () => {
  it('starts where the run does', () => {
    expect(timeRunOf(NINE, HOUR, RULES)).toEqual({ start: NINE, end: t(10) });
  });

  it('is none past midnight, past a limit, or without a start', () => {
    expect(timeRunOf(t(23), HOUR, RULES)).toBeNull();
    expect(timeRunOf(NINE, 5 * HOUR, RULES)).toBeNull();
    expect(timeRunOf(null, HOUR, RULES)).toBeNull();
  });
});

describe('what a run is refused for', () => {
  it.each([
    [{ start: NINE, end: t(10) }, null],
    [{ start: NINE, end: t(8) }, { reason: 'order' }],
    [
      { start: NINE, end: t(14) },
      { by: HOUR, reason: 'over' },
    ],
    [
      { start: NINE, end: t(9, 10) },
      { by: 1200, reason: 'short' },
    ],
    [{ start: NINE, end: null }, null],
    [null, null],
  ])('%o is %o', (run, refusal) => {
    expect(refusalOfTimes(run, RULES)).toEqual(refusal);
  });

  it('names the bounds and an unavailable end', () => {
    expect(refusalOfTimes({ start: t(7), end: NINE }, { ...RULES, min: t(8) })).toEqual({
      reason: 'bounds',
    });
    expect(
      refusalOfTimes(
        { start: NINE, end: t(10) },
        { ...RULES, unavailable: ({ hour }) => hour === 10 },
      ),
    ).toEqual({ reason: 'unavailable' });
  });
});
