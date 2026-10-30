import { describe, expect, it } from 'vitest';

import { plainTime } from './plain-time';
import {
  DATE_TIME_UNITS,
  isRelativeKey,
  parseDuration,
  resolveRelative,
  resolveRelativeDateTime,
  TIME_UNITS,
} from './duration';

describe('isRelativeKey', () => {
  it('names the three keys that open an expression, and nothing else', () => {
    expect(['+', '-', '='].every(isRelativeKey)).toBe(true);
    expect(isRelativeKey('9')).toBe(false);
    expect(isRelativeKey('h')).toBe(false);
    expect(isRelativeKey('ArrowUp')).toBe(false);
  });
});

describe('parseDuration', () => {
  it('reads a bare number as minutes, which is the unit a booking asks in', () => {
    expect(parseDuration('40')).toBe(40 * 60);
    expect(parseDuration('+40')).toBe(40 * 60);
    expect(parseDuration('-15')).toBe(-15 * 60);
  });

  it('reads each unit letter', () => {
    expect(parseDuration('2h')).toBe(2 * 3600);
    expect(parseDuration('40m')).toBe(40 * 60);
    expect(parseDuration('90s')).toBe(90);
  });

  it('reads a compound the two ways a reader writes one', () => {
    expect(parseDuration('1h30')).toBe(90 * 60);
    expect(parseDuration('1h30m')).toBe(90 * 60);
    expect(parseDuration('1:30')).toBe(90 * 60);
    expect(parseDuration('1:30:15')).toBe(90 * 60 + 15);
    expect(parseDuration('2h15m30s')).toBe(2 * 3600 + 15 * 60 + 30);
  });

  it('reads the trailing bare number as the next unit down', () => {
    expect(parseDuration('1h30')).toBe(parseDuration('1h30m'));
    expect(parseDuration('2m30')).toBe(2 * 60 + 30);
  });

  it('reads now, which is the zero case and the control at the head of the panel', () => {
    expect(parseDuration('=')).toBe(0);
    expect(parseDuration('0')).toBe(0);
    expect(parseDuration('+0')).toBe(0);
  });

  it('ignores the spaces a reader leaves', () => {
    expect(parseDuration(' + 1h 30m ')).toBe(90 * 60);
  });

  it('is not case sensitive', () => {
    expect(parseDuration('1H30M')).toBe(90 * 60);
  });

  /**
   * An expression the reader has not finished is not an expression that means
   * zero. `null` is what keeps the preview empty and `Enter` refused until the
   * text says something.
   */
  it('answers null while the expression is unfinished or wrong', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('+')).toBeNull();
    expect(parseDuration('-')).toBeNull();
    expect(parseDuration('h')).toBeNull();
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('1h30x')).toBeNull();
    expect(parseDuration('1:')).toBeNull();
  });

  it('refuses units written out of order, rather than adding them anyway', () => {
    expect(parseDuration('30m1h')).toBeNull();
    expect(parseDuration('30s15m')).toBeNull();
  });

  it('refuses the locale own words, and the placeholder says so', () => {
    expect(parseDuration('daqui a 40 minutos')).toBeNull();
    expect(parseDuration('in 40 minutes')).toBeNull();
  });
});

describe('resolveRelative', () => {
  it('lands where the duration says, inside the day', () => {
    expect(resolveRelative(plainTime(14, 40), 40 * 60)).toEqual({
      time: plainTime(15, 20),
      days: 0,
    });
  });

  it('says so when the duration runs past midnight', () => {
    expect(resolveRelative(plainTime(23, 0), 90 * 60)).toEqual({
      time: plainTime(0, 30),
      days: 1,
    });
  });

  it('says so going backwards too', () => {
    expect(resolveRelative(plainTime(0, 15), -30 * 60)).toEqual({
      time: plainTime(23, 45),
      days: -1,
    });
  });

  it('answers now with the anchor itself', () => {
    expect(resolveRelative(plainTime(9, 7, 3), 0)).toEqual({ time: plainTime(9, 7, 3), days: 0 });
  });
});

/**
 * The grammar widens for `datetime-field`, and it widens **additively**: the
 * default unit set is still the three a time can mean, so every expression
 * `time-field` parsed parses the same way and a `d` typed into a `time-field`
 * is refused there exactly as it was before.
 */
describe('the wider unit set', () => {
  it('refuses days and weeks by default, which is what a time alone can mean', () => {
    expect(TIME_UNITS).toEqual(['h', 'm', 's']);
    expect(parseDuration('+2d')).toBeNull();
    expect(parseDuration('+1w')).toBeNull();
  });

  it('reads them when the caller states the wider set', () => {
    const units = DATE_TIME_UNITS;
    expect(parseDuration('+2d', { units })).toBe(2 * 86_400);
    expect(parseDuration('+1w', { units })).toBe(7 * 86_400);
    expect(parseDuration('1d6h', { units })).toBe(86_400 + 6 * 3600);
    expect(parseDuration('-3d', { units })).toBe(-3 * 86_400);
  });

  it('leaves every expression the narrower set read exactly as it was', () => {
    const units = DATE_TIME_UNITS;
    for (const text of ['+40', '+40m', '1h30', '1:30', '2h', '90s', '0', '=', '-15']) {
      expect(parseDuration(text, { units })).toBe(parseDuration(text));
    }
  });

  it('keeps the units in order, whichever set is allowed', () => {
    const units = DATE_TIME_UNITS;
    /* A unit written above the one before it is two durations rather than one. */
    expect(parseDuration('6h1d', { units })).toBeNull();
    expect(parseDuration('1d1w', { units })).toBeNull();
  });

  it('refuses a bare number that would fall to a unit the caller did not allow', () => {
    /* `1w30` in a grammar without days means nothing, and is refused rather
       than read as the part before it. */
    expect(parseDuration('1w30', { units: ['w'] })).toBeNull();
  });
});

/**
 * Where `crossesMidnight` is spent. `time-field` raises the flag because a
 * `PlainTime` has no day to put the crossing in; here the day exists, so the
 * crossing is the value.
 */
describe('resolveRelativeDateTime', () => {
  const anchor = {
    date: { year: 2026, month: 9, day: 30 },
    time: plainTime(23, 0),
  };

  it('rolls the day rather than raising a flag', () => {
    expect(resolveRelativeDateTime(anchor, 90 * 60)).toEqual({
      date: { year: 2026, month: 10, day: 1 },
      time: plainTime(0, 30),
    });
  });

  it('moves whole days without touching the time', () => {
    expect(resolveRelativeDateTime(anchor, 2 * 86_400)).toEqual({
      date: { year: 2026, month: 10, day: 2 },
      time: plainTime(23, 0),
    });
  });

  it('answers now with the anchor itself', () => {
    expect(resolveRelativeDateTime(anchor, 0)).toEqual(anchor);
  });
});
