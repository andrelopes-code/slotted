import { describe, expect, it } from 'vitest';

import {
  addDateTimeSeconds,
  compareDateTime,
  dayWindow,
  isDateTimeInRange,
  isDayInRange,
  isPlainDateTime,
  isSameDateTime,
  parseISODateTime,
  plainDateTime,
  toISODateTime,
  wallClockIn,
} from './plain-date-time';
import type { PlainDateTime } from './plain-date-time';

const at = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0,
): PlainDateTime => ({ date: { year, month, day }, time: { hour, minute, second } });

describe('plainDateTime', () => {
  it('holds the two halves under their own names', () => {
    const value = plainDateTime(
      { year: 2026, month: 9, day: 10 },
      { hour: 15, minute: 20, second: 0 },
    );
    expect(value.date).toEqual({ year: 2026, month: 9, day: 10 });
    expect(value.time).toEqual({ hour: 15, minute: 20, second: 0 });
    expect(isPlainDateTime(value)).toBe(true);
    expect(isPlainDateTime({ year: 2026 })).toBe(false);
  });

  it('refuses a half that is not a date or not a time', () => {
    expect(() =>
      plainDateTime({ year: 2026, month: 13, day: 1 }, { hour: 0, minute: 0, second: 0 }),
    ).toThrow();
    expect(() =>
      plainDateTime({ year: 2026, month: 9, day: 10 }, { hour: 24, minute: 0, second: 0 }),
    ).toThrow();
  });
});

describe('comparison', () => {
  it('orders by the day first and by the time inside it', () => {
    expect(compareDateTime(at(2026, 9, 10, 23), at(2026, 9, 11, 0))).toBeLessThan(0);
    expect(compareDateTime(at(2026, 9, 10, 9), at(2026, 9, 10, 17))).toBeLessThan(0);
    expect(compareDateTime(at(2026, 9, 10, 9), at(2026, 9, 10, 9))).toBe(0);
  });

  it('treats two absent values as the same one', () => {
    expect(isSameDateTime(at(2026, 9, 10, 9), at(2026, 9, 10, 9))).toBe(true);
    expect(isSameDateTime(null, null)).toBe(true);
    expect(isSameDateTime(null, at(2026, 9, 10, 9))).toBe(false);
  });

  it('bounds the whole value', () => {
    const min = at(2026, 9, 10, 9);
    const max = at(2026, 9, 12, 17);
    expect(isDateTimeInRange(at(2026, 9, 10, 9), min, max)).toBe(true);
    expect(isDateTimeInRange(at(2026, 9, 10, 8, 59), min, max)).toBe(false);
    expect(isDateTimeInRange(at(2026, 9, 12, 17, 1), min, max)).toBe(false);
    expect(isDateTimeInRange(at(2026, 9, 11, 3), min, max)).toBe(true);
  });
});

describe('ISO 8601', () => {
  it('reads and writes the shape input[type=datetime-local] uses', () => {
    expect(parseISODateTime('2026-09-10T15:20')).toEqual(at(2026, 9, 10, 15, 20));
    expect(parseISODateTime('2026-09-10T15:20:45')).toEqual(at(2026, 9, 10, 15, 20, 45));
    expect(toISODateTime(at(2026, 9, 10, 15, 20, 45))).toBe('2026-09-10T15:20:45');
  });

  /**
   * An instant is refused rather than truncated. The offset is a fact this
   * library does not hold, and dropping it silently is the daylight defect
   * every surveyed implementation ships.
   */
  it('refuses an instant instead of dropping its offset', () => {
    expect(parseISODateTime('2026-09-10T15:20:45Z')).toBeNull();
    expect(parseISODateTime('2026-09-10T15:20:45-03:00')).toBeNull();
    expect(parseISODateTime('2026-09-10')).toBeNull();
  });
});

/**
 * The flag `time-field` raises, spent. `addSeconds` reports the midnights a
 * step crossed because a `PlainTime` has no day to put them in; here there is
 * one, and the crossing is the value rather than a fact beside it.
 */
describe('addDateTimeSeconds', () => {
  it('carries the day when seconds run past midnight', () => {
    expect(addDateTimeSeconds(at(2026, 9, 30, 23, 0), 90 * 60)).toEqual(at(2026, 10, 1, 0, 30));
  });

  it('carries it backwards across a year boundary too', () => {
    expect(addDateTimeSeconds(at(2026, 1, 1, 0, 30), -90 * 60)).toEqual(at(2025, 12, 31, 23, 0));
  });

  it('moves whole days without touching the time', () => {
    expect(addDateTimeSeconds(at(2026, 9, 10, 14, 40), 2 * 86_400)).toEqual(
      at(2026, 9, 12, 14, 40),
    );
  });
});

/**
 * The capability MUI's own validation page records that it cannot ship: "you
 * cannot use `maxDateTime` and `maxTime` together. `maxDateTime` will override
 * the `maxTime` behavior." They are two questions and both are answered.
 */
describe('dayWindow', () => {
  const options = {
    min: at(2026, 9, 10, 14),
    max: at(2026, 9, 12, 11),
    minTime: { hour: 9, minute: 0, second: 0 },
    maxTime: { hour: 18, minute: 0, second: 0 },
  };

  it('starts the first day where the range starts, not at the window floor', () => {
    expect(dayWindow({ year: 2026, month: 9, day: 10 }, options)).toEqual({
      earliest: { hour: 14, minute: 0, second: 0 },
      latest: { hour: 18, minute: 0, second: 0 },
    });
  });

  /* The rule MDN states for the platform and no surveyed script implements:
     the time of day is only constrained on the first and last dates. */
  it('gives a day inside the range the window and nothing else', () => {
    expect(dayWindow({ year: 2026, month: 9, day: 11 }, options)).toEqual({
      earliest: { hour: 9, minute: 0, second: 0 },
      latest: { hour: 18, minute: 0, second: 0 },
    });
  });

  it('ends the last day where the range ends', () => {
    expect(dayWindow({ year: 2026, month: 9, day: 12 }, options)).toEqual({
      earliest: { hour: 9, minute: 0, second: 0 },
      latest: { hour: 11, minute: 0, second: 0 },
    });
  });

  it('gives a day outside the range no window at all', () => {
    expect(dayWindow({ year: 2026, month: 9, day: 9 }, options)).toBeNull();
    expect(dayWindow({ year: 2026, month: 9, day: 13 }, options)).toBeNull();
  });

  /**
   * A range that starts after the day closes leaves nothing, and saying so is
   * what lets a panel draw its empty state rather than an empty box.
   */
  it('says a day is closed when the two bounds have crossed on it', () => {
    const crossed = {
      min: at(2026, 9, 10, 19),
      maxTime: { hour: 17, minute: 0, second: 0 },
    };
    expect(dayWindow({ year: 2026, month: 9, day: 10 }, crossed)).toBeNull();
    expect(isDayInRange({ year: 2026, month: 9, day: 10 }, crossed)).toBe(false);
  });

  it('opens the whole day when nothing is bounded', () => {
    expect(dayWindow({ year: 2026, month: 9, day: 10 })).toEqual({
      earliest: { hour: 0, minute: 0, second: 0 },
      latest: { hour: 23, minute: 59, second: 59 },
    });
  });
});

describe('wallClockIn', () => {
  it('reads an instant as the wall clock of the zone named', () => {
    const instant = Date.UTC(2026, 8, 24, 15, 30, 5);
    expect(wallClockIn(instant, 'America/Sao_Paulo')).toEqual(at(2026, 9, 24, 12, 30, 5));
    expect(wallClockIn(new Date(instant), 'Asia/Tokyo')).toEqual(at(2026, 9, 25, 0, 30, 5));
  });

  /** The hour that does not exist is never produced; the hour that repeats is produced twice. */
  it('follows the zone across a daylight-saving change', () => {
    expect(wallClockIn(Date.UTC(2026, 2, 8, 6, 59), 'America/New_York')).toEqual(
      at(2026, 3, 8, 1, 59),
    );
    expect(wallClockIn(Date.UTC(2026, 2, 8, 7, 0), 'America/New_York')).toEqual(
      at(2026, 3, 8, 3, 0),
    );
    const first = wallClockIn(Date.UTC(2026, 10, 1, 5, 30), 'America/New_York');
    const second = wallClockIn(Date.UTC(2026, 10, 1, 6, 30), 'America/New_York');
    expect(first).toEqual(at(2026, 11, 1, 1, 30));
    expect(second).toEqual(first);
  });

  it('writes midnight as the start of the day, never as 24', () => {
    expect(wallClockIn(Date.UTC(2026, 0, 1, 0, 0), 'UTC')).toEqual(at(2026, 1, 1, 0, 0));
  });
});
