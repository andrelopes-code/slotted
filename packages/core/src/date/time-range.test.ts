import { describe, expect, it } from 'vitest';

import { plainDate } from './plain-date';
import { plainTime } from './plain-time';
import {
  dateTimeRangeProblems,
  dateTimeRangeSeconds,
  durationLabel,
  firstUnavailableIndex,
  openingIndex,
  runRefusal,
  timeRangeProblems,
  timeRangeSeconds,
} from './time-range';

const t = (hour: number, minute = 0) => plainTime(hour, minute);
const d = (day: number) => plainDate(2026, 9, day);
const dt = (day: number, hour: number, minute = 0) => ({ date: d(day), time: t(hour, minute) });

describe('timeRangeSeconds', () => {
  it('counts the seconds from the first end to the second', () => {
    expect(timeRangeSeconds(t(14), t(16, 30))).toBe(9000);
  });

  it('is negative when the second end comes first', () => {
    expect(timeRangeSeconds(t(16, 30), t(14))).toBe(-9000);
  });

  it('is zero for the same time at both ends', () => {
    expect(timeRangeSeconds(t(9), t(9))).toBe(0);
  });
});

describe('dateTimeRangeSeconds', () => {
  it('carries the days between the two ends', () => {
    expect(dateTimeRangeSeconds(dt(12, 14), dt(13, 8))).toBe(18 * 3600);
    expect(dateTimeRangeSeconds(dt(12, 14), dt(16, 11))).toBe(3 * 86_400 + 21 * 3600);
  });

  it('is negative when the second end comes first', () => {
    expect(dateTimeRangeSeconds(dt(13, 8), dt(12, 14))).toBe(-18 * 3600);
  });
});

describe('durationLabel', () => {
  it('writes hours and minutes, omitting the units at zero', () => {
    expect(durationLabel(9000, 'en')).toBe('2 hr 30 min');
    expect(durationLabel(7200, 'en')).toBe('2 hr');
    expect(durationLabel(1800, 'en')).toBe('30 min');
  });

  it('writes days before hours', () => {
    expect(durationLabel(3 * 86_400 + 21 * 3600, 'en')).toBe('3 days 21 hr');
  });

  it('writes zero as zero minutes, or zero seconds at the second granularity', () => {
    expect(durationLabel(0, 'en')).toBe('0 min');
    expect(durationLabel(0, 'en', 'second')).toBe('0 sec');
  });

  it('writes seconds only at the second granularity', () => {
    expect(durationLabel(95, 'en')).toBe('1 min');
    expect(durationLabel(95, 'en', 'second')).toBe('1 min 35 sec');
  });

  it('takes the sign off a reversed run', () => {
    expect(durationLabel(-9000, 'en')).toBe('2 hr 30 min');
  });

  it('follows the locale', () => {
    expect(durationLabel(9000, 'pt-BR')).toBe('2 h 30 min');
    expect(durationLabel(9000, 'de')).toBe('2 Std. 30 Min.');
  });
});

describe('runRefusal', () => {
  it('refuses a candidate on the wrong side of the anchor', () => {
    expect(runRefusal(9000, 8000, 1, {})).toBe(true);
    expect(runRefusal(9000, 9000, 1, {})).toBe(false);
    expect(runRefusal(9000, 10_000, -1, {})).toBe(true);
  });

  it('refuses a candidate outside the duration limits', () => {
    const rules = { minLength: 1800, maxLength: 7200 };
    expect(runRefusal(0, 900, 1, rules)).toBe(true);
    expect(runRefusal(0, 1800, 1, rules)).toBe(false);
    expect(runRefusal(0, 7200, 1, rules)).toBe(false);
    expect(runRefusal(0, 8100, 1, rules)).toBe(true);
    expect(runRefusal(9000, 900, -1, rules)).toBe(true);
    expect(runRefusal(9000, 3600, -1, rules)).toBe(false);
  });
});

describe('firstUnavailableIndex', () => {
  const list = [false, false, true, false, true, false].map((unavailable, index) => ({
    time: t(index),
    unavailable,
  }));

  it('finds the first refused option on either side of an index', () => {
    expect(firstUnavailableIndex(list, 3, 1)).toBe(4);
    expect(firstUnavailableIndex(list, 3, -1)).toBe(2);
  });

  it('gives -1 when nothing is refused on that side', () => {
    expect(firstUnavailableIndex(list, 5, 1)).toBe(-1);
    expect(firstUnavailableIndex(list, 1, -1)).toBe(-1);
  });
});

describe('timeRangeProblems', () => {
  it('finds nothing wrong with nothing', () => {
    expect(timeRangeProblems(null, {})).toEqual([]);
    expect(timeRangeProblems({ start: t(9), end: null }, {})).toEqual([]);
  });

  it('names an end before its start, and does not swap them', () => {
    expect(timeRangeProblems({ start: t(22), end: t(6) }, {})).toEqual(['order']);
  });

  it('names an end outside the bounds', () => {
    const rules = { min: t(9), max: t(17) };
    expect(timeRangeProblems({ start: t(8), end: t(10) }, rules)).toEqual(['min']);
    expect(timeRangeProblems({ start: t(10), end: t(18) }, rules)).toEqual(['max']);
  });

  it('names an unavailable end', () => {
    const unavailable = (time: { hour: number }) => time.hour === 12;
    expect(timeRangeProblems({ start: t(12), end: t(14) }, { unavailable })).toEqual([
      'unavailable',
    ]);
    expect(timeRangeProblems({ start: t(11), end: t(14) }, { unavailable })).toEqual([]);
  });

  it('names a duration outside the limits, in seconds', () => {
    expect(timeRangeProblems({ start: t(9), end: t(9, 15) }, { minLength: 1800 })).toEqual([
      'length',
    ]);
    expect(timeRangeProblems({ start: t(9), end: t(14) }, { maxLength: 4 * 3600 })).toEqual([
      'length',
    ]);
    expect(timeRangeProblems({ start: t(9), end: t(11) }, { maxLength: 4 * 3600 })).toEqual([]);
  });

  it('does not measure a reversed run', () => {
    expect(timeRangeProblems({ start: t(14), end: t(9) }, { minLength: 1800 })).toEqual(['order']);
  });
});

describe('dateTimeRangeProblems', () => {
  it('names an end before its start across days', () => {
    expect(dateTimeRangeProblems({ start: dt(13, 8), end: dt(12, 14) }, {})).toEqual(['order']);
    expect(dateTimeRangeProblems({ start: dt(12, 14), end: dt(13, 8) }, {})).toEqual([]);
  });

  it('bounds the whole value and the day window together', () => {
    const rules = { min: dt(10, 9), minTime: t(8), maxTime: t(18) };
    expect(dateTimeRangeProblems({ start: dt(10, 8, 30), end: dt(11, 9) }, rules)).toEqual(['min']);
    expect(dateTimeRangeProblems({ start: dt(11, 7), end: dt(11, 9) }, rules)).toEqual(['min']);
    expect(dateTimeRangeProblems({ start: dt(11, 9), end: dt(11, 19) }, rules)).toEqual(['max']);
    expect(dateTimeRangeProblems({ start: dt(11, 9), end: dt(11, 18) }, rules)).toEqual([]);
  });

  it('runs the day predicate over the days between and the time predicate over the ends', () => {
    const unavailableDay = (date: { day: number }) => date.day === 14;
    const unavailableTime = (time: { hour: number }) => time.hour === 12;
    expect(
      dateTimeRangeProblems({ start: dt(12, 9), end: dt(16, 11) }, { unavailableDay }),
    ).toEqual(['unavailable']);
    expect(
      dateTimeRangeProblems(
        { start: dt(12, 9), end: dt(16, 11) },
        { unavailableDay, contiguous: false },
      ),
    ).toEqual([]);
    expect(
      dateTimeRangeProblems({ start: dt(12, 12), end: dt(13, 11) }, { unavailableTime }),
    ).toEqual(['unavailable']);
  });

  it('measures the duration across days', () => {
    expect(
      dateTimeRangeProblems({ start: dt(12, 14), end: dt(16, 11) }, { maxLength: 3 * 86_400 }),
    ).toEqual(['length']);
  });
});

describe('openingIndex', () => {
  const list = [t(13), t(13, 30), t(14), t(14, 30), t(15)].map((time, index) => ({
    time,
    unavailable: index < 2,
  }));

  it('opens on the wanted row when it is offered', () => {
    expect(openingIndex(list, t(14, 30), null, 'end')).toBe(3);
    expect(openingIndex(list, t(14, 40), null, 'end')).toBe(3);
  });

  it('opens on the offered row nearest to a refused one', () => {
    expect(openingIndex(list, t(10), null, 'end')).toBe(2);
    expect(openingIndex(list, t(13, 20), null, 'end')).toBe(2);
  });

  it('steps off the other end rather than proposing no length', () => {
    expect(openingIndex(list, t(10), t(14), 'end')).toBe(3);
    expect(openingIndex(list, t(15), t(15), 'start')).toBe(3);
    expect(openingIndex(list.slice(0, 3), t(14), t(14), 'end')).toBe(2);
  });

  it('lands somewhere when nothing is offered', () => {
    expect(openingIndex([], t(14), null, 'end')).toBe(-1);
    expect(openingIndex(list.slice(0, 2), t(14), null, 'end')).toBe(0);
  });
});
