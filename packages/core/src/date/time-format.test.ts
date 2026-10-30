import { describe, expect, it } from 'vitest';

import { plainTime } from './plain-time';
import { createTimeFormat, hourCycleRange } from './time-format';

const fields = (locale: string, options = {}) =>
  createTimeFormat({ locale, ...options })
    .pattern.filter((part) => part.type !== 'literal')
    .map((part) => part.type);

describe('createTimeFormat', () => {
  it('takes the field order and the separators from the locale', () => {
    const format = createTimeFormat({ locale: 'pt-BR' });
    expect(format.pattern.map((part) => part.type)).toEqual(['hour', 'literal', 'minute']);
    expect(format.pattern[1]?.value).toBe(':');
  });

  it('draws the day period where the locale writes it', () => {
    expect(fields('en-US')).toEqual(['hour', 'minute', 'dayPeriod']);
    expect(fields('pt-BR')).toEqual(['hour', 'minute']);
  });

  it('draws seconds only at second granularity', () => {
    expect(fields('pt-BR', { granularity: 'second' })).toEqual(['hour', 'minute', 'second']);
    expect(fields('pt-BR', { granularity: 'hour' })).toEqual(['hour']);
  });
});

/**
 * `Intl` resolves four cycles and a boolean can say two. The public axis is
 * the question a consumer asks; which variant of each the locale writes is the
 * locale's, so `ja-JP` under 12 keeps the `h11` it actually uses.
 */
describe('hour cycles', () => {
  it('keeps the locale own cycle when the consumer states nothing', () => {
    expect(createTimeFormat({ locale: 'pt-BR' }).hourCycle).toBe('h23');
    expect(createTimeFormat({ locale: 'en-US' }).hourCycle).toBe('h12');
  });

  it('answers a stated twelve with the locale variant of twelve', () => {
    expect(createTimeFormat({ locale: 'pt-BR', hourCycle: 12 }).hourCycle).toBe('h12');
    expect(createTimeFormat({ locale: 'ja-JP', hourCycle: 12 }).hourCycle).toBe('h11');
  });

  it('answers a stated twenty-four with the locale variant of twenty-four', () => {
    expect(createTimeFormat({ locale: 'en-US', hourCycle: 24 }).hourCycle).toBe('h23');
  });

  it('gives each cycle the range its hour segment actually runs over', () => {
    expect(hourCycleRange('h11')).toEqual({ min: 0, max: 11 });
    expect(hourCycleRange('h12')).toEqual({ min: 1, max: 12 });
    expect(hourCycleRange('h23')).toEqual({ min: 0, max: 23 });
    expect(hourCycleRange('h24')).toEqual({ min: 1, max: 24 });
  });
});

/**
 * The segment holds what the reader sees. Midnight is `12 AM` to an American,
 * `0 AM` to a Japanese reader and `00` to a Brazilian, and all three are the
 * same `PlainTime`.
 */
describe('toDisplay and fromDisplay', () => {
  it('writes midnight and noon the way each cycle writes them', () => {
    const h12 = createTimeFormat({ locale: 'en-US', hourCycle: 12 });
    expect(h12.toDisplay(0)).toEqual({ hour: 12, dayPeriod: 0 });
    expect(h12.toDisplay(12)).toEqual({ hour: 12, dayPeriod: 1 });
    expect(h12.toDisplay(13)).toEqual({ hour: 1, dayPeriod: 1 });

    const h11 = createTimeFormat({ locale: 'ja-JP', hourCycle: 12 });
    expect(h11.toDisplay(0)).toEqual({ hour: 0, dayPeriod: 0 });
    expect(h11.toDisplay(12)).toEqual({ hour: 0, dayPeriod: 1 });

    const h23 = createTimeFormat({ locale: 'pt-BR' });
    expect(h23.toDisplay(0)).toEqual({ hour: 0, dayPeriod: null });
    expect(h23.toDisplay(23)).toEqual({ hour: 23, dayPeriod: null });
  });

  it('reads every display hour back to the hour it came from', () => {
    for (const locale of ['en-US', 'ja-JP', 'pt-BR']) {
      for (const cycle of [12, 24] as const) {
        const format = createTimeFormat({ locale, hourCycle: cycle });
        for (let hour = 0; hour < 24; hour += 1) {
          const shown = format.toDisplay(hour);
          expect(format.fromDisplay(shown.hour, shown.dayPeriod)).toBe(hour);
        }
      }
    }
  });
});

describe('format and formatField', () => {
  it('writes the whole time in the locale shape', () => {
    expect(createTimeFormat({ locale: 'pt-BR' }).format(plainTime(9, 5))).toBe('09:05');
    expect(
      createTimeFormat({ locale: 'pt-BR', granularity: 'second' }).format(plainTime(9, 5, 7)),
    ).toBe('09:05:07');
  });

  it('pads a field to its own width so the columns hold their place', () => {
    const format = createTimeFormat({ locale: 'pt-BR' });
    expect(format.formatField(plainTime(9, 5), 'hour')).toBe('09');
    expect(format.formatField(plainTime(9, 5), 'minute')).toBe('05');
  });

  it('writes the day period with the locale own name', () => {
    const format = createTimeFormat({ locale: 'en-US' });
    expect(format.dayPeriodNames()).toHaveLength(2);
    expect(format.formatField(plainTime(9, 0), 'dayPeriod')).toBe(format.dayPeriodNames()[0]);
    expect(format.formatField(plainTime(21, 0), 'dayPeriod')).toBe(format.dayPeriodNames()[1]);
  });

  it('writes the locale own digits, so a numbering system survives', () => {
    const format = createTimeFormat({ locale: 'ar-EG' });
    expect(format.digits[0]).toBe('٠');
    expect(format.formatField(plainTime(9, 5), 'minute')).toBe('٠٥');
  });
});

describe('placeholders', () => {
  it('says the field name in the reader own language', () => {
    const pt = createTimeFormat({ locale: 'pt-BR' });
    expect(pt.pattern.find((part) => part.type === 'hour')?.value).toBe('hh');
    expect(pt.pattern.find((part) => part.type === 'minute')?.value).toBe('mm');

    const en = createTimeFormat({ locale: 'en-US' });
    expect(en.pattern.find((part) => part.type === 'dayPeriod')?.value).toBe(
      en.dayPeriodNames()[0],
    );
  });
});

describe('parse', () => {
  it('reads the locale shape back', () => {
    expect(createTimeFormat({ locale: 'pt-BR' }).parse('09:05')).toEqual(plainTime(9, 5));
    expect(createTimeFormat({ locale: 'en-US' }).parse('9:05 PM')).toEqual(plainTime(21, 5));
    expect(createTimeFormat({ locale: 'en-US' }).parse('12:05 AM')).toEqual(plainTime(0, 5));
  });

  it('reads ISO 8601 in every locale', () => {
    expect(createTimeFormat({ locale: 'en-US' }).parse('21:05')).toEqual(plainTime(21, 5));
    expect(createTimeFormat({ locale: 'pt-BR' }).parse('21:05:30')).toEqual(plainTime(21, 5, 30));
  });

  it('reads the locale own digits', () => {
    expect(createTimeFormat({ locale: 'ar-EG' }).parse('٠٩:٠٥')).toEqual(plainTime(9, 5));
  });

  it('refuses what it cannot read rather than guessing', () => {
    const format = createTimeFormat({ locale: 'pt-BR' });
    expect(format.parse('')).toBeNull();
    expect(format.parse('tomorrow')).toBeNull();
    expect(format.parse('25:00')).toBeNull();
  });
});

describe('describe', () => {
  it('says the whole time in words, which is what a screen reader is given', () => {
    const spoken = createTimeFormat({ locale: 'en-US' }).describe(plainTime(21, 5));
    expect(spoken).toMatch(/9/);
    expect(spoken).toMatch(/PM/i);
  });
});
