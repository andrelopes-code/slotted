import { describe, expect, it } from 'vitest';

import {
  addSeconds,
  clampTime,
  compareTime,
  isPlainTime,
  isSameTime,
  isTimeInRange,
  nowIn,
  parseISOTime,
  plainTime,
  secondsOfDay,
  timeOfSeconds,
  toISOTime,
} from './plain-time';

describe('plainTime', () => {
  it('holds the three numbers and nothing else', () => {
    expect(plainTime(14, 30, 15)).toEqual({ hour: 14, minute: 30, second: 15 });
  });

  it('defaults the minute and the second, so an hour alone is a time', () => {
    expect(plainTime(9)).toEqual({ hour: 9, minute: 0, second: 0 });
  });

  it('refuses an hour the clock does not have', () => {
    expect(() => plainTime(24, 0)).toThrow(/hour/);
    expect(() => plainTime(-1, 0)).toThrow(/hour/);
  });

  it('refuses a minute and a second the clock does not have', () => {
    expect(() => plainTime(12, 60)).toThrow(/minute/);
    expect(() => plainTime(12, 0, 60)).toThrow(/second/);
  });

  it('refuses a fraction, because a clock field is a whole number', () => {
    expect(() => plainTime(12, 30.5)).toThrow(/minute/);
  });
});

describe('isPlainTime', () => {
  it('recognizes the shape and refuses everything else', () => {
    expect(isPlainTime({ hour: 0, minute: 0, second: 0 })).toBe(true);
    expect(isPlainTime({ hour: 1, minute: 2 })).toBe(false);
    expect(isPlainTime(null)).toBe(false);
    expect(isPlainTime(new Date())).toBe(false);
  });
});

describe('compareTime and isSameTime', () => {
  it('orders by hour, then minute, then second', () => {
    expect(compareTime(plainTime(9, 0), plainTime(10, 0))).toBeLessThan(0);
    expect(compareTime(plainTime(9, 30), plainTime(9, 5))).toBeGreaterThan(0);
    expect(compareTime(plainTime(9, 5, 10), plainTime(9, 5, 9))).toBeGreaterThan(0);
    expect(compareTime(plainTime(9, 5, 9), plainTime(9, 5, 9))).toBe(0);
  });

  it('treats two absent times as the same and one as different', () => {
    expect(isSameTime(null, null)).toBe(true);
    expect(isSameTime(null, plainTime(1))).toBe(false);
    expect(isSameTime(plainTime(1, 2, 3), plainTime(1, 2, 3))).toBe(true);
  });
});

describe('secondsOfDay and timeOfSeconds', () => {
  it('counts from midnight', () => {
    expect(secondsOfDay(plainTime(0, 0, 0))).toBe(0);
    expect(secondsOfDay(plainTime(23, 59, 59))).toBe(86_399);
    expect(secondsOfDay(plainTime(1, 1, 1))).toBe(3661);
  });

  it('reads a count back, wrapping a day it has run past', () => {
    expect(timeOfSeconds(3661)).toEqual(plainTime(1, 1, 1));
    expect(timeOfSeconds(86_400)).toEqual(plainTime(0, 0, 0));
    expect(timeOfSeconds(-1)).toEqual(plainTime(23, 59, 59));
  });
});

/**
 * The one thing no surveyed implementation says: a time has no day beside it,
 * so a step that runs past midnight lands on a different one and the caller
 * has to be told.
 */
describe('addSeconds', () => {
  it('steps inside the day and crosses nothing', () => {
    expect(addSeconds(plainTime(9, 0), 30 * 60)).toEqual({ time: plainTime(9, 30), days: 0 });
  });

  it('says how many midnights it crossed going forward', () => {
    expect(addSeconds(plainTime(23, 0), 90 * 60)).toEqual({ time: plainTime(0, 30), days: 1 });
    expect(addSeconds(plainTime(23, 0), 25 * 3600)).toEqual({ time: plainTime(0, 0), days: 2 });
  });

  it('says so going backward too', () => {
    expect(addSeconds(plainTime(0, 30), -60 * 60)).toEqual({ time: plainTime(23, 30), days: -1 });
  });

  it('lands exactly on midnight without claiming a crossing it did not make', () => {
    expect(addSeconds(plainTime(23, 30), 30 * 60)).toEqual({ time: plainTime(0, 0), days: 1 });
    expect(addSeconds(plainTime(0, 0), 0)).toEqual({ time: plainTime(0, 0), days: 0 });
  });
});

describe('clampTime and isTimeInRange', () => {
  it('pulls a time back to the bound it passed', () => {
    expect(clampTime(plainTime(7, 0), plainTime(9, 0), plainTime(18, 0))).toEqual(plainTime(9, 0));
    expect(clampTime(plainTime(20, 0), plainTime(9, 0), plainTime(18, 0))).toEqual(
      plainTime(18, 0),
    );
    expect(clampTime(plainTime(12, 0), plainTime(9, 0), plainTime(18, 0))).toEqual(
      plainTime(12, 0),
    );
  });

  it('answers a bound that is not there', () => {
    expect(isTimeInRange(plainTime(3, 0), undefined, undefined)).toBe(true);
    expect(isTimeInRange(plainTime(3, 0), plainTime(9, 0), undefined)).toBe(false);
    expect(isTimeInRange(plainTime(18, 0), undefined, plainTime(18, 0))).toBe(true);
  });
});

describe('toISOTime and parseISOTime', () => {
  it('writes the shape a form post carries', () => {
    expect(toISOTime(plainTime(9, 5, 0))).toBe('09:05:00');
    expect(toISOTime(plainTime(9, 5, 0), 'minute')).toBe('09:05');
    expect(toISOTime(plainTime(9, 5, 0), 'hour')).toBe('09');
  });

  it('reads it back, with or without the seconds', () => {
    expect(parseISOTime('09:05')).toEqual(plainTime(9, 5, 0));
    expect(parseISOTime('09:05:30')).toEqual(plainTime(9, 5, 30));
    expect(parseISOTime(' 23:59:59 ')).toEqual(plainTime(23, 59, 59));
  });

  it('refuses anything that is not that shape, rather than guessing', () => {
    expect(parseISOTime('9:05')).toBeNull();
    expect(parseISOTime('24:00')).toBeNull();
    expect(parseISOTime('09:60')).toBeNull();
    expect(parseISOTime('09:05:30.500')).toBeNull();
    expect(parseISOTime('2026-09-10T09:05')).toBeNull();
    expect(parseISOTime('')).toBeNull();
  });
});

describe('nowIn', () => {
  it('answers a time the clock has', () => {
    const now = nowIn('UTC');
    expect(isPlainTime(now)).toBe(true);
    expect(secondsOfDay(now)).toBeGreaterThanOrEqual(0);
    expect(secondsOfDay(now)).toBeLessThan(86_400);
  });

  /**
   * `Intl` writes midnight as hour 24 in the `h24` cycle `en-US` reaches when
   * asked for `hourCycle: 'h23'` on some engines, so the read is normalized
   * rather than trusted. A time of 24:00:00 is not a time this library has.
   */
  it('never answers hour twenty-four', () => {
    expect(nowIn('UTC').hour).toBeLessThan(24);
  });

  it('answers two zones with two different times', () => {
    const tokyo = secondsOfDay(nowIn('Asia/Tokyo'));
    const utc = secondsOfDay(nowIn('UTC'));
    expect(Math.abs(tokyo - utc) % 86_400).not.toBe(0);
  });
});
