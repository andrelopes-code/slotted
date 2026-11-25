import { describe, expect, it } from 'vitest';

import { createTranslator, pickerPanelMessages } from '../i18n';
import {
  dayMeta,
  headDay,
  momentMeta,
  monthMeta,
  shortDay,
  shortMoment,
  shortRun,
  stepLabel,
  timeMeta,
} from './picker-words';
import { plainDate } from './plain-date';
import { plainDateTime } from './plain-date-time';
import { plainTime } from './plain-time';

const t = createTranslator({ locale: 'en-US' }).family(pickerPanelMessages);
const now = plainTime(10, 20);

describe('the words of a panel', () => {
  it('say how far a date is from today, and its week', () => {
    expect(dayMeta(plainDate(2026, 11, 30), plainDate(2026, 11, 25), 'en-US', t)).toBe(
      'in 5 days, week 49',
    );
  });

  it('say how far a time is from now', () => {
    expect(timeMeta(plainTime(14, 30), now, 'en-US', t)).toBe('in 4 hr 10 min');
    expect(timeMeta(plainTime(9, 30), now, 'en-US', t)).toBe('50 min ago');
    expect(timeMeta(now, now, 'en-US', t)).toBe('Now');
  });

  it('carry the days between two moments', () => {
    const from = plainDateTime(plainDate(2026, 11, 25), now);

    expect(
      momentMeta(plainDateTime(plainDate(2026, 11, 27), plainTime(17)), from, 'en-US', t),
    ).toBe('in 2 days 6 hr 40 min');
  });

  it('name a step by its length', () => {
    expect(stepLabel(900, 'en-US')).toBe('+15 min');
    expect(stepLabel(86400, 'en-US')).toBe('+1 day');
  });

  it('write a moment on the clock it is read on', () => {
    const moment = plainDateTime(plainDate(2026, 11, 30), plainTime(14, 30));

    expect(shortMoment(moment, 'en-US')).toBe('Nov 30, 2:30 PM');
    expect(shortMoment(moment, 'en-US', { hourCycle: 24 })).toBe('Nov 30, 14:30');
    expect(shortMoment(moment, 'en-US', { granularity: 'hour', hourCycle: 24 })).toBe('Nov 30, 14');
  });

  it('write a day, a run of days and a month', () => {
    const today = plainDate(2026, 11, 25);

    expect(shortDay(plainDate(2026, 11, 30), 'en-US')).toBe('Mon, Nov 30');
    expect(headDay(plainDate(2026, 11, 30), today, 'en-US')).toBe('Mon, November 30');
    expect(headDay(plainDate(2027, 1, 4), today, 'en-US')).toBe('Mon, January 4, 2027');
    expect(shortRun(plainDate(2026, 11, 27), plainDate(2026, 12, 4), 'en-US')).toBe(
      'Nov 27\u2009–\u2009Dec 4',
    );
    expect(monthMeta(plainDate(2026, 12, 1), today, 'en-US')).toBe('next month');
    expect(monthMeta(plainDate(2027, 2, 1), today, 'en-US')).toBe('in 3 months');
  });
});
