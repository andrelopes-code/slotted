import { describe, expect, it } from 'vitest';

import { plainDate } from './plain-date';
import { presetValue, relativeDays } from './relative';

const today = plainDate(2026, 11, 25);

describe('relativeDays', () => {
  it('says how far a date is from another, in words', () => {
    expect(relativeDays(today, plainDate(2026, 11, 30), 'en-US')).toBe('in 5 days');
    expect(relativeDays(today, plainDate(2026, 11, 23), 'en-US')).toBe('2 days ago');
  });

  it('names the days that have a name', () => {
    expect(relativeDays(today, today, 'en-US')).toBe('today');
    expect(relativeDays(today, plainDate(2026, 11, 26), 'en-US')).toBe('tomorrow');
    expect(relativeDays(today, plainDate(2026, 11, 24), 'en-US')).toBe('yesterday');
  });

  it('crosses a month and a year', () => {
    expect(relativeDays(today, plainDate(2027, 1, 1), 'en-US')).toBe('in 37 days');
  });

  it('writes the locale', () => {
    // language: pt-BR
    expect(relativeDays(today, plainDate(2026, 11, 30), 'pt-BR')).toBe('em 5 dias');
    // language: en-US
  });
});

describe('presetValue', () => {
  it('answers the value, or resolves it', () => {
    expect(presetValue({ label: 'Noon', value: 12 })).toBe(12);
    expect(presetValue({ label: 'Noon', value: () => 12 })).toBe(12);
  });
});
