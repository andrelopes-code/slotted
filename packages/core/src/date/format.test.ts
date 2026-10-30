import { describe, expect, it } from 'vitest';

import { createDateFormat, plainDate } from './index';

const NINTH = plainDate(2026, 9, 9);

describe('the pattern the locale writes', () => {
  it('takes the field order from the locale rather than from a table', () => {
    const fields = (locale: string) =>
      createDateFormat({ locale })
        .pattern.filter((part) => part.type !== 'literal')
        .map((part) => part.type);

    expect(fields('pt-BR')).toEqual(['day', 'month', 'year']);
    expect(fields('en-US')).toEqual(['month', 'day', 'year']);
    expect(fields('ja-JP')).toEqual(['year', 'month', 'day']);
  });

  it('takes the separators from the locale too', () => {
    const literals = (locale: string) =>
      createDateFormat({ locale })
        .pattern.filter((part) => part.type === 'literal')
        .map((part) => part.value);

    expect(literals('pt-BR')).toEqual(['/', '/']);
    expect(literals('de-DE')).toEqual(['.', '.']);
  });

  /**
   * The placeholder is the locale's own word for the field, not `mm/dd/yyyy`
   * translated by nobody: `Intl.DisplayNames` names the day, month and year
   * fields per locale, so the empty field reads `dd/mm/aaaa` in pt-BR.
   */
  it("writes the placeholder in the reader's own language", () => {
    const placeholder = (locale: string) =>
      createDateFormat({ locale })
        .pattern.map((part) => part.value)
        .join('');

    expect(placeholder('pt-BR')).toBe('dd/mm/aaaa');
    expect(placeholder('en-US')).toBe('mm/dd/yyyy');
    expect(placeholder('de-DE')).toBe('tt.mm.jjjj');
  });

  /**
   * A four-digit year whatever the locale's short format writes. `en-US`
   * short is `9/9/26`, and 26 is not a year a reader can check at a glance.
   */
  it('always gives the year four digits', () => {
    for (const locale of ['pt-BR', 'en-US', 'ja-JP', 'de-DE']) {
      const format = createDateFormat({ locale });
      expect(format.formatField(NINTH, 'year')).toHaveLength(4);
    }
  });
});

describe('writing and reading a date', () => {
  it('reads back everything it writes, in every surveyed locale', () => {
    for (const locale of ['pt-BR', 'en-US', 'ja-JP', 'de-DE', 'ar-EG']) {
      const format = createDateFormat({ locale });
      expect(format.parse(format.format(NINTH))).toEqual(NINTH);
    }
  });

  it('writes the digits the locale writes', () => {
    expect(createDateFormat({ locale: 'pt-BR' }).format(NINTH)).toBe('09/09/2026');
    expect(createDateFormat({ locale: 'en-US' }).format(NINTH)).toBe('09/09/2026');
    /* Arabic-Indic digits, which the parser has to read back. */
    expect(createDateFormat({ locale: 'ar-EG' }).formatField(NINTH, 'day')).toBe('٠٩');
  });

  /**
   * A date pasted from a URL, a spreadsheet or an API response. The locale
   * shape is tried first, then ISO 8601, because a `pt-BR` reader pasting
   * `09/09/2026` means September and a `en-US` reader pasting it means the same
   * date only by coincidence.
   */
  it('parses a pasted date in the locale shape, then in ISO 8601', () => {
    const brazil = createDateFormat({ locale: 'pt-BR' });
    expect(brazil.parse('09/09/2026')).toEqual(NINTH);
    expect(brazil.parse('9/9/2026')).toEqual(NINTH);
    expect(brazil.parse('2026-09-09')).toEqual(NINTH);

    const states = createDateFormat({ locale: 'en-US' });
    expect(states.parse('12/03/2026')).toEqual(plainDate(2026, 12, 3));
    expect(brazil.parse('12/03/2026')).toEqual(plainDate(2026, 3, 12));
  });

  it('refuses text that is not a date, and a date the calendar has not got', () => {
    const brazil = createDateFormat({ locale: 'pt-BR' });
    expect(brazil.parse('29/02/2025')).toBe(null);
    // language: pt-BR
    expect(brazil.parse('amanhã')).toBe(null);
    // language: en-US
    expect(brazil.parse('09/2026')).toBe(null);
    expect(brazil.parse('')).toBe(null);
  });
});

describe('names', () => {
  it('gives twelve months and seven weekdays, from the locale', () => {
    const brazil = createDateFormat({ locale: 'pt-BR' });
    expect(brazil.monthNames('long')).toHaveLength(12);
    expect(brazil.monthNames('long')[8]).toBe('setembro');
    expect(brazil.weekdayNames('long')).toHaveLength(7);
  });

  /**
   * The weekdays start on the day the locale starts its week on, so the row of
   * column headers and the columns of the grid cannot disagree.
   */
  it("orders the weekdays from the locale's own first day", () => {
    expect(createDateFormat({ locale: 'pt-BR' }).firstDayOfWeek).toBe(0);
    expect(createDateFormat({ locale: 'de-DE' }).firstDayOfWeek).toBe(1);
    expect(createDateFormat({ locale: 'pt-BR' }).weekdayNames('long')[0]).toBe('domingo');
    expect(createDateFormat({ locale: 'de-DE' }).weekdayNames('long')[0]).toBe('Montag');
  });

  it("takes an explicit first day over the locale's, because a product may fix one", () => {
    const format = createDateFormat({ locale: 'pt-BR', firstDayOfWeek: 1 });
    expect(format.firstDayOfWeek).toBe(1);
    expect(format.weekdayNames('long')[0]).toBe('segunda-feira');
  });

  it('writes the heading and the whole date a screen reader hears', () => {
    const brazil = createDateFormat({ locale: 'pt-BR' });
    expect(brazil.monthYear(NINTH)).toBe('setembro de 2026');
    expect(brazil.describe(NINTH)).toContain('setembro');
    expect(brazil.describe(NINTH)).toContain('2026');
  });
});
