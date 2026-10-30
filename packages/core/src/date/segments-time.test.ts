import { describe, expect, it } from 'vitest';

import { fieldRange } from './format';
import { plainDate } from './plain-date';
import { plainTime } from './plain-time';
import {
  boundSegment,
  clearSegment,
  EMPTY_SEGMENTS,
  isTimeComplete,
  segmentsOf,
  segmentsOfTime,
  stepSegment,
  timeOf,
  typeDayPeriod,
  typeDigit,
} from './segments';
import { createTimeFormat } from './time-format';

const pt = createTimeFormat({ locale: 'pt-BR' });
const en = createTimeFormat({ locale: 'en-US' });
const withSeconds = createTimeFormat({ locale: 'pt-BR', granularity: 'second' });

const reference = { ...plainDate(2026, 9, 10), hour: 9, minute: 0, second: 0, dayPeriod: 0 };
const at = (format = pt) => ({ ...reference, hourCycle: format.hourCycle });

/**
 * The engine is the one the date chain published. Widening it rather than
 * copying it is what lets `datetime-field` hold one state for both halves.
 */
describe('one segment state for both halves', () => {
  it('starts every field empty, date and time alike', () => {
    expect(EMPTY_SEGMENTS.hour).toBeNull();
    expect(EMPTY_SEGMENTS.minute).toBeNull();
    expect(EMPTY_SEGMENTS.second).toBeNull();
    expect(EMPTY_SEGMENTS.dayPeriod).toBeNull();
  });

  it('leaves the time fields empty when a date fills the date ones', () => {
    const segments = segmentsOf(plainDate(2026, 9, 10));
    expect(segments.year).toBe(2026);
    expect(segments.hour).toBeNull();
  });

  it('leaves the date fields empty when a time fills the time ones', () => {
    const segments = segmentsOfTime(plainTime(14, 30), pt);
    expect(segments.hour).toBe(14);
    expect(segments.minute).toBe(30);
    expect(segments.year).toBeNull();
  });

  it('holds what the reader sees, so a twelve-hour locale holds a display hour', () => {
    const segments = segmentsOfTime(plainTime(14, 30), en);
    expect(segments.hour).toBe(2);
    expect(segments.dayPeriod).toBe(1);
  });
});

describe('fieldRange', () => {
  it('gives each hour cycle the range its segment runs over', () => {
    expect(fieldRange('hour', { hourCycle: 'h23' })).toEqual({ min: 0, max: 23 });
    expect(fieldRange('hour', { hourCycle: 'h12' })).toEqual({ min: 1, max: 12 });
    expect(fieldRange('hour', { hourCycle: 'h11' })).toEqual({ min: 0, max: 11 });
    expect(fieldRange('hour', { hourCycle: 'h24' })).toEqual({ min: 1, max: 24 });
  });

  it('gives the minute and the second the sixty the clock has', () => {
    expect(fieldRange('minute')).toEqual({ min: 0, max: 59 });
    expect(fieldRange('second')).toEqual({ min: 0, max: 59 });
  });

  it('gives the day period the two values it holds', () => {
    expect(fieldRange('dayPeriod')).toEqual({ min: 0, max: 1 });
  });

  /**
   * Every existing call passes a year and a month. Without them the day's
   * maximum is stated rather than derived from a month that is not there.
   */
  it('answers the day without a month, rather than answering nothing', () => {
    expect(fieldRange('day', { year: 2025, month: 2 })).toEqual({ min: 1, max: 28 });
    expect(fieldRange('day')).toEqual({ min: 1, max: 31 });
  });
});

describe('stepping a time segment', () => {
  it('wraps inside the segment and never carries into the next', () => {
    const start = segmentsOfTime(plainTime(23, 59), pt);
    const stepped = stepSegment(start, 'minute', 1, at());
    expect(stepped.minute).toBe(0);
    expect(stepped.hour).toBe(23);
  });

  it('wraps the hour at the top of its own cycle', () => {
    const start = segmentsOfTime(plainTime(23, 0), pt);
    expect(stepSegment(start, 'hour', 1, at()).hour).toBe(0);

    const twelve = segmentsOfTime(plainTime(23, 0), en);
    expect(twelve.hour).toBe(11);
    expect(stepSegment(twelve, 'hour', 1, at(en)).hour).toBe(12);
  });

  it('steps an empty segment from the reference rather than from a minimum', () => {
    expect(stepSegment(EMPTY_SEGMENTS, 'hour', 0, at()).hour).toBe(9);
  });

  it('turns the day period over on one press', () => {
    const morning = segmentsOfTime(plainTime(9, 0), en);
    expect(morning.dayPeriod).toBe(0);
    expect(stepSegment(morning, 'dayPeriod', 1, at(en)).dayPeriod).toBe(1);
    expect(stepSegment(morning, 'dayPeriod', -1, at(en)).dayPeriod).toBe(1);
  });

  it('moves a segment to either edge of its own range', () => {
    const start = segmentsOfTime(plainTime(9, 30), pt);
    expect(boundSegment(start, 'minute', 'min', at()).minute).toBe(0);
    expect(boundSegment(start, 'minute', 'max', at()).minute).toBe(59);
    expect(boundSegment(start, 'hour', 'max', at()).hour).toBe(23);
  });

  /**
   * One state holds both halves, which is what `datetime-field` needs. The
   * rule that pulls a 31 back across a short month belongs to the date half
   * alone, and a stepped hour must not reach into it.
   */
  it('leaves the held day alone, because a stepped hour has no day to hold', () => {
    const date = segmentsOf(plainDate(2026, 1, 31));
    const time = segmentsOfTime(plainTime(9, 0), pt);
    const both = { ...date, hour: time.hour, minute: time.minute, second: time.second };

    expect(stepSegment(both, 'hour', 1, at()).day).toBe(31);
    expect(stepSegment(both, 'hour', 1, at()).intendedDay).toBe(31);
    expect(stepSegment(both, 'hour', 1, at()).hour).toBe(10);
  });
});

describe('typing a time segment', () => {
  it('ends a run when no further digit fits under the maximum', () => {
    /* 5 could still become 50 to 59, so the run waits; 6 could not, so it ends. */
    const waits = typeDigit(EMPTY_SEGMENTS, 'minute', 5, pt, at());
    expect(waits.segments.minute).toBe(5);
    expect(waits.advance).toBe(false);

    const ends = typeDigit(EMPTY_SEGMENTS, 'minute', 6, pt, at());
    expect(ends.segments.minute).toBe(6);
    expect(ends.advance).toBe(true);

    const held = typeDigit(EMPTY_SEGMENTS, 'minute', 3, pt, at());
    expect(typeDigit(held.segments, 'minute', 0, pt, at()).segments.minute).toBe(30);
  });

  it('ends the hour run at the cycle own maximum, not at a fixed twenty-four', () => {
    const twelve = typeDigit(EMPTY_SEGMENTS, 'hour', 2, en, { ...reference, hourCycle: 'h12' });
    expect(twelve.segments.hour).toBe(2);
    /* Nothing fits after a 2 under a maximum of 12, so the run ends there. */
    expect(twelve.advance).toBe(true);

    const twentyFour = typeDigit(EMPTY_SEGMENTS, 'hour', 2, pt, { ...reference, hourCycle: 'h23' });
    /* 23 still fits under a maximum of 23, so the run waits for a second digit. */
    expect(twentyFour.advance).toBe(false);
  });

  it('takes the day period by its first letter, in the locale own name', () => {
    const [morning, evening] = en.dayPeriodNames();
    const set = typeDayPeriod(EMPTY_SEGMENTS, evening.charAt(0), en);
    expect(set?.segments.dayPeriod).toBe(1);
    expect(set?.advance).toBe(true);
    expect(
      typeDayPeriod(EMPTY_SEGMENTS, morning.charAt(0).toLowerCase(), en)?.segments.dayPeriod,
    ).toBe(0);
  });

  it('answers null for a letter neither name starts with', () => {
    expect(typeDayPeriod(EMPTY_SEGMENTS, 'z', en)).toBeNull();
  });

  it('empties one field back to its placeholder', () => {
    const start = segmentsOfTime(plainTime(9, 30), pt);
    expect(clearSegment(start, 'minute').minute).toBeNull();
    expect(clearSegment(start, 'minute').hour).toBe(9);
  });
});

/**
 * The gap the inventory names: an hour with no minute is a state every
 * surveyed implementation is unable to hold, and the value derived from it is
 * `null` rather than a time nobody typed.
 */
describe('timeOf', () => {
  it('answers null while any drawn field is unfilled', () => {
    expect(timeOf(EMPTY_SEGMENTS, pt)).toBeNull();
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 9 }, pt)).toBeNull();
    expect(isTimeComplete({ ...EMPTY_SEGMENTS, hour: 9 }, pt)).toBe(false);
  });

  it('answers the time once every drawn field is filled', () => {
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 9, minute: 5 }, pt)).toEqual(plainTime(9, 5));
    expect(isTimeComplete({ ...EMPTY_SEGMENTS, hour: 9, minute: 5 }, pt)).toBe(true);
  });

  it('does not ask for a field the granularity does not draw', () => {
    const format = createTimeFormat({ locale: 'pt-BR', granularity: 'hour' });
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 9 }, format)).toEqual(plainTime(9, 0));
  });

  it('asks for the second only at second granularity', () => {
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 9, minute: 5 }, withSeconds)).toBeNull();
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 9, minute: 5, second: 7 }, withSeconds)).toEqual(
      plainTime(9, 5, 7),
    );
  });

  it('asks for the day period wherever the cycle draws one', () => {
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 2, minute: 30 }, en)).toBeNull();
    expect(timeOf({ ...EMPTY_SEGMENTS, hour: 2, minute: 30, dayPeriod: 1 }, en)).toEqual(
      plainTime(14, 30),
    );
  });

  it('reads every display hour back to the time it came from', () => {
    for (const format of [pt, en, createTimeFormat({ locale: 'ja-JP', hourCycle: 12 })]) {
      for (let hour = 0; hour < 24; hour += 1) {
        const time = plainTime(hour, 30);
        expect(timeOf(segmentsOfTime(time, format), format)).toEqual(time);
      }
    }
  });
});
