import { describe, expect, it } from 'vitest';

import { createDateTimeFormat, halfOfField } from './datetime-format';
import type { PlainDateTime } from './plain-date-time';

const value: PlainDateTime = {
  date: { year: 2026, month: 9, day: 10 },
  time: { hour: 15, minute: 20, second: 45 },
};

const fields = (locale: string, options = {}) =>
  createDateTimeFormat({ locale, ...options })
    .pattern.filter((part) => part.type !== 'literal')
    .map((part) => part.type);

describe('the combined pattern', () => {
  /**
   * The three things only one `Intl.DateTimeFormat` over both halves can say.
   * Two independent formatters each know their own order and neither knows
   * which half comes first, what the locale writes between them, or where the
   * day period lands — which is the whole reason the field draws one row.
   */
  it('takes the order of the halves from the locale', () => {
    expect(fields('pt-BR')).toEqual(['day', 'month', 'year', 'hour', 'minute']);
    expect(fields('en-US')).toEqual(['month', 'day', 'year', 'hour', 'minute', 'dayPeriod']);
    expect(fields('ja-JP')).toEqual(['year', 'month', 'day', 'hour', 'minute']);
  });

  /**
   * `ja-JP` under the twelve-hour axis resolves `h11`, and writes the day
   * period *before* the hour. A boolean cannot say either.
   */
  it('puts the day period where the locale puts it', () => {
    const japanese = createDateTimeFormat({ locale: 'ja-JP', hourCycle: 12 });
    expect(japanese.hourCycle).toBe('h11');
    const order = japanese.pattern.filter((part) => part.type !== 'literal').map((p) => p.type);
    expect(order.indexOf('dayPeriod')).toBeLessThan(order.indexOf('hour'));

    const american = createDateTimeFormat({ locale: 'en-US', hourCycle: 12 });
    expect(american.hourCycle).toBe('h12');
    const western = american.pattern.filter((part) => part.type !== 'literal').map((p) => p.type);
    expect(western.indexOf('dayPeriod')).toBeGreaterThan(western.indexOf('hour'));
  });

  it('marks which half every part belongs to', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR' });
    for (const part of format.pattern) {
      if (part.type === 'literal') continue;
      expect(part.half).toBe(halfOfField(part.type));
    }
  });

  /**
   * The boundary is found rather than assumed, and it is what lets the row
   * break between the two boxes and nowhere else.
   */
  it('names the literal between the halves, and whether it is drawn', () => {
    /* `pt-BR`, `en-US` and `de-DE` all write a comma there. */
    for (const locale of ['pt-BR', 'en-US', 'de-DE']) {
      const comma = createDateTimeFormat({ locale }).pattern.find((part) => part.boundary === true);
      expect(comma, locale).toBeDefined();
      expect(comma?.value.trim(), locale).toBe(',');
      expect(comma?.drawn, locale).toBe(true);
      /* It sits at the end of the first half, so a wrap leaves it at the end of
         its line the way a comma in a sentence goes. */
      expect(comma?.half, locale).toBe('date');
    }

    /* `fr-FR`, `ja-JP` and `zh-CN` write a bare space, which the row's own
       column gap already provides. */
    for (const locale of ['fr-FR', 'ja-JP', 'zh-CN']) {
      const space = createDateTimeFormat({ locale }).pattern.find((part) => part.boundary === true);
      expect(space, locale).toBeDefined();
      expect(space?.drawn, locale).toBe(false);
    }

    /* `ko-KR` ends its date form with a full stop, and that stop is the
       boundary — drawn, and belonging to the date half. */
    const korean = createDateTimeFormat({ locale: 'ko-KR' }).pattern.find(
      (part) => part.boundary === true,
    );
    expect(korean?.drawn).toBe(true);
    expect(korean?.half).toBe('date');
  });

  it('draws the seconds only when the granularity asks for them', () => {
    expect(fields('pt-BR', { granularity: 'hour' })).toEqual(['day', 'month', 'year', 'hour']);
    expect(fields('pt-BR', { granularity: 'second' })).toEqual([
      'day',
      'month',
      'year',
      'hour',
      'minute',
      'second',
    ]);
  });

  /* The placeholder of every field is the one its own half already draws, so
     a datetime says `dd/mm/aaaa hh:mm` in the reader's own language. */
  it('takes each placeholder from the half that owns the field', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR' });
    const placeholder = (type: string) => format.pattern.find((part) => part.type === type)?.value;
    expect(placeholder('day')).toBe('dd');
    expect(placeholder('year')).toBe('aaaa');
    expect(placeholder('hour')).toBe('hh');
  });
});

describe('formatting', () => {
  it('writes the whole value in the locale s shape', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR' });
    expect(format.format(value)).toBe('10/09/2026, 15:20');
  });

  it('pads every numeric field, whatever the locale would do alone', () => {
    const format = createDateTimeFormat({ locale: 'en-US', hourCycle: 12 });
    expect(format.formatField(value, 'month')).toBe('09');
    expect(format.formatField(value, 'hour')).toBe('03');
    expect(format.formatField(value, 'dayPeriod')).toBe(format.dayPeriodNames()[1]);
  });

  /**
   * `drawn` governs the row of segments, not a string: a string has no column
   * gap to lean on, so leaving a whitespace boundary out would run the two
   * halves together.
   */
  it('writes an undrawn boundary into the string anyway', () => {
    const format = createDateTimeFormat({ locale: 'fr-FR' });
    const boundary = format.pattern.find((part) => part.boundary === true);
    expect(boundary?.drawn).toBe(false);
    expect(format.format(value)).toBe('10/09/2026 15:20');
  });

  it('gives a screen reader the whole value in words', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR' });
    const spoken = format.describe(value);
    expect(spoken).toContain('setembro');
    expect(spoken).toContain('15:20');
  });
});

describe('parsing', () => {
  it('reads ISO 8601 first', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR' });
    expect(format.parse('2026-09-10T15:20')).toEqual({
      date: { year: 2026, month: 9, day: 10 },
      time: { hour: 15, minute: 20, second: 0 },
    });
  });

  it('reads the locale s own shape, split at the boundary', () => {
    const brazilian = createDateTimeFormat({ locale: 'pt-BR' });
    expect(brazilian.parse('10/09/2026 15:20')).toEqual({
      date: { year: 2026, month: 9, day: 10 },
      time: { hour: 15, minute: 20, second: 0 },
    });

    const american = createDateTimeFormat({ locale: 'en-US', hourCycle: 12 });
    expect(american.parse('9/10/2026, 3:20 PM')).toEqual({
      date: { year: 2026, month: 9, day: 10 },
      time: { hour: 15, minute: 20, second: 0 },
    });
  });

  it('refuses text that is neither', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR' });
    expect(format.parse('')).toBeNull();
    // language: pt-BR
    expect(format.parse('amanhã')).toBeNull();
    // language: en-US
    expect(format.parse('10/09/2026')).toBeNull();
  });

  it('reads each half with its own parser, including the locale s digits', () => {
    const arabic = createDateTimeFormat({ locale: 'ar-EG' });
    const written = arabic.format(value);
    expect(arabic.parse(written)).toEqual({
      date: { year: 2026, month: 9, day: 10 },
      time: { hour: 15, minute: 20, second: 0 },
    });
  });
});

describe('delegation', () => {
  it('keeps both halves reachable for a caller that needs one alone', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR', hourCycle: 24 });
    expect(format.date.locale).toBe(format.locale);
    expect(format.time.hourCycle).toBe(format.hourCycle);
    expect(format.firstDayOfWeek).toBe(format.date.firstDayOfWeek);
  });

  it('passes the year pivot through to the half that owns it', () => {
    const format = createDateTimeFormat({ locale: 'pt-BR', yearPivot: 20 });
    expect(format.resolveYear(30)).toBe(format.date.resolveYear(30));
  });
});

describe('the spaces it writes', () => {
  /**
   * ICU writes U+202F before the day period in Node and some browsers, and
   * U+0020 in others, so a value rendered on a server and again in a browser
   * differed by one character and React threw the server's tree away.
   */
  it('writes plain spaces in the pattern and in words, whatever the engine writes', () => {
    const format = createDateTimeFormat({ locale: 'en-US', hourCycle: 12 });
    const value = {
      date: { year: 2026, month: 9, day: 30 },
      time: { hour: 18, minute: 45, second: 0 },
    };
    const written = [
      ...format.pattern.filter((part) => part.type === 'literal').map((part) => part.value),
      ...format.time.pattern.filter((part) => part.type === 'literal').map((part) => part.value),
      format.describe(value),
      format.time.describe(value.time),
      format.time.format(value.time),
    ];

    for (const text of written) expect(text).not.toMatch(/[\u00a0\u202f]/);
    expect(format.describe(value)).toBe('September 30, 2026 at 6:45 PM');
  });
});
