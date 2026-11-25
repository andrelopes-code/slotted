import { describe, expect, it } from 'vitest';

import { createTranslator, pickerPanelMessages } from '../i18n';
import { dayMeta, momentMeta, stepLabel, timeMeta } from './picker-words';
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
});
