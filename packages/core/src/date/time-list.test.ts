import { describe, expect, it } from 'vitest';

import { plainTime, toISOTime } from './plain-time';
import { MAX_OPTIONS, nearestIndex, timeList } from './time-list';

const shown = (options: ReturnType<typeof timeList>) =>
  options.map((option) => toISOTime(option.time, 'minute'));

describe('timeList', () => {
  it('counts a whole day at the step it was given', () => {
    expect(timeList({ step: 3600 })).toHaveLength(24);
    expect(timeList({ step: 900 })).toHaveLength(96);
  });

  it('starts at midnight when no lower bound says otherwise', () => {
    expect(shown(timeList({ step: 3600 }))[0]).toBe('00:00');
  });

  /**
   * The platform's own rule for `input[type=time]`: the step base is `min`
   * when it is stated. No surveyed panel says what its base is.
   */
  it('counts from the lower bound, which is the base a step has', () => {
    const list = shown(timeList({ step: 900, min: plainTime(9, 7), max: plainTime(9, 40) }));
    expect(list).toEqual(['09:07', '09:22', '09:37']);
  });

  it('stops at the upper bound rather than passing it', () => {
    const list = shown(timeList({ step: 3600, min: plainTime(9, 0), max: plainTime(11, 30) }));
    expect(list).toEqual(['09:00', '10:00', '11:00']);
  });

  it('never runs past the end of the day', () => {
    expect(shown(timeList({ step: 3600, min: plainTime(22, 0) }))).toEqual(['22:00', '23:00']);
  });

  it('marks what the predicate refuses rather than dropping it', () => {
    const list = timeList({
      step: 3600,
      min: plainTime(9, 0),
      max: plainTime(12, 0),
      isTimeUnavailable: (time) => time.hour === 10,
    });
    expect(list.map((option) => option.unavailable)).toEqual([false, true, false, false]);
  });

  it('answers an empty list when the bounds cross, rather than throwing', () => {
    expect(timeList({ step: 900, min: plainTime(18, 0), max: plainTime(9, 0) })).toEqual([]);
  });

  it('refuses a step that would never advance', () => {
    expect(timeList({ step: 0 })).toEqual([]);
    expect(timeList({ step: -60 })).toEqual([]);
  });

  /**
   * A step finer than a minute is a real configuration — a thirty-second slot
   * inside a five-minute window is eleven rows — and refusing it on the size of
   * the step refused the window along with the day it was aimed at.
   */
  it('takes a step finer than a minute, inside bounds that make it a list', () => {
    const list = timeList({ step: 30, min: plainTime(9, 0), max: plainTime(9, 2) });
    expect(list).toHaveLength(5);
    expect(list[1]?.time).toEqual(plainTime(9, 0, 30));
  });
});

/**
 * The explicit list, which is what a consumer with irregular times has: a
 * clinic open at 09:00, 09:20 and 13:45 cannot say that with a step, and a
 * predicate only subtracts from times that fall on one.
 */
describe('an explicit list of times', () => {
  it('offers exactly the times it was given, in the order it was given them', () => {
    const list = timeList({
      step: 900,
      options: [plainTime(9, 0), plainTime(9, 20), plainTime(13, 45)],
    });
    expect(shown(list)).toEqual(['09:00', '09:20', '13:45']);
  });

  it('still answers the bounds and the predicate', () => {
    const list = timeList({
      step: 900,
      options: [plainTime(8, 0), plainTime(9, 20), plainTime(13, 45)],
      min: plainTime(9, 0),
      isTimeUnavailable: (time) => time.hour === 13,
    });
    expect(list.map((option) => option.unavailable)).toEqual([true, false, true]);
  });

  it('holds a second-level set, which a step over a whole day cannot', () => {
    const list = timeList({
      step: 900,
      options: [plainTime(0, 0, 15), plainTime(0, 0, 30), plainTime(0, 1, 0)],
    });
    expect(list.map((option) => toISOTime(option.time))).toEqual([
      '00:00:15',
      '00:00:30',
      '00:01:00',
    ]);
  });
});

/**
 * The guard is on the length of the list and not on the size of the step. A day
 * at a one-minute step is 1440 rows and legitimate; a day at a one-second step
 * is 86 400 and a configuration mistake, and it must not reach the DOM.
 */
describe('MAX_OPTIONS', () => {
  it('is a whole day at a one-minute step', () => {
    expect(MAX_OPTIONS).toBe(1440);
    expect(timeList({ step: 60 })).toHaveLength(1440);
  });

  it('cuts a list that would run past the cap, rather than building it', () => {
    expect(timeList({ step: 1 })).toHaveLength(1440);
  });

  it('takes a cap the consumer raises', () => {
    expect(timeList({ step: 1, max: plainTime(0, 59, 59), maxOptions: 4000 })).toHaveLength(3600);
  });

  it('cuts an explicit list at the cap too', () => {
    const options = Array.from({ length: 20 }, (_, index) => plainTime(0, index));
    expect(timeList({ step: 900, options, maxOptions: 5 })).toHaveLength(5);
  });
});

describe('nearestIndex', () => {
  const list = timeList({ step: 900 });

  it('finds the option a time falls on', () => {
    expect(nearestIndex(list, plainTime(9, 30))).toBe(38);
  });

  it('finds the closest option when the time falls between two', () => {
    expect(list[nearestIndex(list, plainTime(9, 37))]?.time).toEqual(plainTime(9, 30));
    expect(list[nearestIndex(list, plainTime(9, 38))]?.time).toEqual(plainTime(9, 45));
  });

  it('answers minus one for a list with nothing in it', () => {
    expect(nearestIndex([], plainTime(9, 0))).toBe(-1);
  });
});
