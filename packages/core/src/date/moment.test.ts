import { describe, expect, it } from 'vitest';

import {
  dayTimes,
  isRefusedDay,
  isRefusedMoment,
  isSameMomentDraft,
  momentDraft,
  momentOf,
  stepToDay,
} from './moment';
import { plainDate } from './plain-date';
import { plainDateTime } from './plain-date-time';
import { plainTime } from './plain-time';

const day = (date: number) => plainDate(2026, 9, date);
const at = (date: number, hour: number) => plainDateTime(day(date), plainTime(hour));

const RULES = {
  isDateUnavailable: ({ day: date }: { day: number }) => date === 13,
  isTimeUnavailable: ({ hour }: { hour: number }, { day: date }: { day: number }) =>
    date === 11 && hour === 12,
  max: at(20, 15),
  maxTime: plainTime(18),
  min: at(10, 14),
  minTime: plainTime(8),
};

describe('a moment the rules refuse', () => {
  it.each([
    [at(10, 13), true],
    [at(10, 14), false],
    [at(11, 7), true],
    [at(11, 8), false],
    [at(11, 12), true],
    [at(12, 12), false],
    [at(13, 12), true],
    [at(20, 15), false],
    [at(20, 16), true],
    [at(21, 9), true],
  ])('%o is %s', (moment, refused) => {
    expect(isRefusedMoment(moment, RULES)).toBe(refused);
  });
});

describe('the times of a day', () => {
  it('are the bounds of every day before one is chosen', () => {
    expect(dayTimes(null, RULES)).toEqual({
      isTimeUnavailable: undefined,
      max: plainTime(18),
      min: plainTime(8),
    });
  });

  it('start and end where the range does on its first and last days', () => {
    expect(dayTimes(day(10), RULES).min).toEqual(plainTime(14));
    expect(dayTimes(day(20), RULES).max).toEqual(plainTime(15));
  });

  it('ask the predicate about the day they are of', () => {
    expect(dayTimes(day(11), RULES).isTimeUnavailable?.(plainTime(12))).toBe(true);
    expect(dayTimes(day(12), RULES).isTimeUnavailable?.(plainTime(12))).toBe(false);
  });

  it('are none on a refused day', () => {
    expect(dayTimes(day(13), RULES).isTimeUnavailable?.(plainTime(9))).toBe(true);
    expect(dayTimes(day(21), RULES).isTimeUnavailable?.(plainTime(9))).toBe(true);
  });
});

describe('a draft', () => {
  it('is a moment once both halves are there', () => {
    const draft = momentDraft(at(10, 14));

    expect(momentOf(draft)).toEqual(at(10, 14));
    expect(momentOf({ ...draft, time: null })).toBeNull();
    expect(momentOf(momentDraft(null))).toBeNull();
  });

  it('equals another by both halves', () => {
    expect(isSameMomentDraft(momentDraft(at(10, 14)), momentDraft(at(10, 14)))).toBe(true);
    expect(isSameMomentDraft(momentDraft(at(10, 14)), momentDraft(at(10, 15)))).toBe(false);
    expect(isSameMomentDraft(momentDraft(null), momentDraft(null))).toBe(true);
  });
});

describe('a step of one day', () => {
  const refuses = (date: ReturnType<typeof day>) => isRefusedDay(date, RULES);

  it('passes over the days the rules refuse', () => {
    expect(stepToDay(day(12), 1, refuses)).toEqual(day(14));
    expect(stepToDay(day(14), -1, refuses)).toEqual(day(12));
  });

  it('stops where there is none', () => {
    expect(stepToDay(day(20), 1, refuses)).toBeNull();
  });
});
