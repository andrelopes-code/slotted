import { describe, expect, it } from 'vitest';

import {
  createNumberFormat,
  createScrub,
  decimalsOf,
  figureRuns,
  snapToStep,
  stepNumber,
} from './index';

describe('createNumberFormat', () => {
  it('writes the digits, the group and the decimal the locale writes', () => {
    expect(createNumberFormat({ locale: 'pt-BR' }).format(1480.5)).toBe('1.480,5');
    expect(createNumberFormat({ locale: 'en-US' }).format(1480.5)).toBe('1,480.5');
  });

  it('reads back everything it writes, in either locale', () => {
    const brazil = createNumberFormat({ locale: 'pt-BR' });
    expect(brazil.parse(brazil.format(1480.5))).toBe(1480.5);

    const states = createNumberFormat({ locale: 'en-US' });
    expect(states.parse(states.format(1480.5))).toBe(1480.5);
  });

  /**
   * The one a consumer actually hits: a value pasted from a bank statement,
   * with the currency affix and the grouping the bank wrote.
   */
  it('parses a currency string pasted whole', () => {
    const money = createNumberFormat({
      locale: 'pt-BR',
      options: { style: 'currency', currency: 'BRL' },
    });

    expect(money.format(1480)).toBe('R$ 1.480,00');
    expect(money.parse('R$ 1.480,00')).toBe(1480);
    expect(money.parse('1480')).toBe(1480);
  });

  /** Percent is a formatting of one number, so what is written is what is read. */
  it('keeps a percentage a fraction on both sides', () => {
    const percent = createNumberFormat({ locale: 'en-US', options: { style: 'percent' } });

    expect(percent.format(0.15)).toBe('15%');
    expect(percent.parse('15%')).toBe(0.15);
    expect(percent.parse('15')).toBe(0.15);
  });

  it('parses the numerals the locale writes rather than only Latin ones', () => {
    const arabic = createNumberFormat({ locale: 'ar-EG' });

    expect(arabic.parse(arabic.format(1480))).toBe(1480);
    expect(arabic.parse('١٤٨٠')).toBe(1480);
  });

  /** Latin digits always parse, whatever the locale's own numbering system is. */
  it('accepts Latin digits in a locale that does not write them', () => {
    expect(createNumberFormat({ locale: 'ar-EG' }).parse('1480')).toBe(1480);
  });

  it('reads a negative written with a real minus sign as well as a hyphen', () => {
    const format = createNumberFormat({ locale: 'en-US' });

    expect(format.parse('-12')).toBe(-12);
    expect(format.parse('−12')).toBe(-12);
  });

  /** Empty is a value. Nothing typed is not nought. */
  it('reads an empty string as empty rather than as nought', () => {
    expect(createNumberFormat({ locale: 'en-US' }).parse('')).toBeNull();
    expect(createNumberFormat({ locale: 'en-US' }).parse('   ')).toBeNull();
    expect(createNumberFormat({ locale: 'en-US' }).format(null)).toBe('');
  });

  it('reads text that is not on its way to a number as empty', () => {
    expect(createNumberFormat({ locale: 'en-US' }).parse('abc')).toBeNull();
  });

  /**
   * What the keystroke filter asks. A value on its way to being a number keeps
   * the keystroke; anything else is refused before it reaches the element.
   */
  it('recognises the text a reader is part way through typing', () => {
    const format = createNumberFormat({ locale: 'pt-BR' });

    expect(format.isPartial('')).toBe(true);
    expect(format.isPartial('-')).toBe(true);
    expect(format.isPartial('1')).toBe(true);
    expect(format.isPartial('1,')).toBe(true);
    expect(format.isPartial('1.4')).toBe(true);
    expect(format.isPartial('-1,5')).toBe(true);
    expect(format.isPartial('1,2,3')).toBe(false);
    expect(format.isPartial('1a')).toBe(false);
    expect(format.isPartial('--1')).toBe(false);
  });

  it('refuses a fraction the format cannot write', () => {
    const integers = createNumberFormat({
      locale: 'en-US',
      options: { maximumFractionDigits: 0 },
    });

    expect(integers.isPartial('1.')).toBe(false);
    expect(integers.isPartial('12')).toBe(true);
    expect(integers.maximumFractionDigits).toBe(0);
  });

  it('publishes the fraction limit the family derives its keyboard from', () => {
    expect(createNumberFormat({ locale: 'en-US' }).maximumFractionDigits).toBe(3);
    expect(
      createNumberFormat({ locale: 'pt-BR', options: { style: 'currency', currency: 'BRL' } })
        .maximumFractionDigits,
    ).toBe(2);
  });

  /** The announced value and the drawn value are the same string, or one of them lies. */
  it('formats null and a number the same way for the value text', () => {
    const format = createNumberFormat({ locale: 'en-US' });

    expect(format.format(0)).toBe('0');
    expect(format.format(-0)).toBe('-0');
  });
});

/**
 * The reader watches the number take its shape. Grouping exists to make a long
 * number scannable, and a reader who cannot see it until they leave the field
 * cannot check the magnitude at the moment they are getting it wrong.
 *
 * The whole engineering cost of live formatting is here: everything that is
 * still being typed has to survive the rewrite, and the caret has to come back
 * to the character it was on rather than to the index it was at.
 */
describe('formatWhileTyping', () => {
  const typing = (format: ReturnType<typeof createNumberFormat>, keys: string) => {
    const seen: string[] = [];
    let typed = { text: '', caret: 0 };
    for (const key of keys) {
      typed = {
        text: typed.text.slice(0, typed.caret) + key + typed.text.slice(typed.caret),
        caret: typed.caret + 1,
      };
      typed = format.formatWhileTyping(typed);
      seen.push(typed.text);
    }
    return seen;
  };

  it('groups the whole part as each digit arrives', () => {
    expect(typing(createNumberFormat({ locale: 'pt-BR' }), '1234567')).toEqual([
      '1',
      '12',
      '123',
      '1.234',
      '12.345',
      '123.456',
      '1.234.567',
    ]);
  });

  /**
   * The caret is counted in the reader's own characters, not in string
   * indices: a separator appears between two keystrokes and every index after
   * it moves. Counted in indices, the sixth keystroke of `1234567` lands
   * before the fourth digit and the number comes out shuffled.
   */
  it('leaves the caret on the character it was on, not the index it was at', () => {
    const format = createNumberFormat({ locale: 'en-US' });
    expect(format.formatWhileTyping({ text: '1234', caret: 4 })).toEqual({
      text: '1,234',
      caret: 5,
    });
    /* Caret between the 1 and the 2, which the separator now stands between. */
    expect(format.formatWhileTyping({ text: '1234', caret: 1 })).toEqual({
      text: '1,234',
      caret: 1,
    });
  });

  it('keeps the affixes the format writes around the digits', () => {
    expect(
      typing(
        createNumberFormat({ locale: 'pt-BR', options: { style: 'currency', currency: 'BRL' } }),
        '1234',
      ),
    ).toEqual(['R$\u00a01', 'R$\u00a012', 'R$\u00a0123', 'R$\u00a01.234']);
    /* A locale that writes the symbol after the digits keeps the fraction
       inside the number rather than after the symbol. */
    expect(
      createNumberFormat({
        locale: 'de-DE',
        options: { style: 'currency', currency: 'EUR' },
      }).formatWhileTyping({ text: '1234,5', caret: 6 }).text,
    ).toBe('1.234,5\u00a0€');
  });

  /**
   * A percent format writes no fraction by default, so it has no decimal part
   * to read a separator from. The fallback was the full stop, which is the
   * grouping separator in `pt-BR` — the caret then counted every group
   * separator as a character the reader had typed, and the digits came out in
   * the wrong order.
   */
  it('tells the decimal separator from the grouping one on a format that writes no fraction', () => {
    expect(
      typing(createNumberFormat({ locale: 'pt-BR', options: { style: 'percent' } }), '1234'),
    ).toEqual(['1%', '12%', '123%', '1.234%']);
  });

  it('writes the numerals of the locale it was given', () => {
    expect(
      createNumberFormat({ locale: 'ar-EG' }).formatWhileTyping({ text: '1234', caret: 4 }),
    ).toEqual({ text: '١٬٢٣٤', caret: 5 });
  });

  /**
   * Rounding, padding and trimming are a commit's job. A keystroke that took
   * away the nought the reader had just typed, or added the ones they had not,
   * would be a field arguing with the person filling it in.
   */
  it('leaves everything still being typed exactly as typed', () => {
    const format = createNumberFormat({ locale: 'pt-BR' });
    const shown = (text: string) => format.formatWhileTyping({ text, caret: text.length }).text;

    expect(shown('1,')).toBe('1,');
    expect(shown('1,50')).toBe('1,50');
    expect(shown('1,500')).toBe('1,500');
    expect(shown('-')).toBe('-');
    expect(shown(',5')).toBe(',5');
    expect(shown('-,5')).toBe('-,5');
    expect(shown('')).toBe('');
  });

  it('holds a fraction longer than the format writes until the commit rounds it', () => {
    const money = createNumberFormat({
      locale: 'pt-BR',
      options: { style: 'currency', currency: 'BRL' },
    });
    expect(money.formatWhileTyping({ text: '1,2345', caret: 6 }).text).toBe('R$\u00a01,2345');
    expect(money.format(money.parse('1,2345'))).toBe('R$\u00a01,23');
  });

  /**
   * The caret can land inside a prefix, and Backspace there takes a character
   * of the affix. The affix is the family's rather than the reader's, so it is
   * put back — the alternative, seen in the browser, was `R 12.345` standing
   * on screen with the value gone to null because no whole affix matched it.
   */
  it('repairs an affix a keystroke landed inside', () => {
    const money = createNumberFormat({
      locale: 'pt-BR',
      options: { style: 'currency', currency: 'BRL' },
    });
    expect(money.formatWhileTyping({ text: 'R 12.345', caret: 1 })).toEqual({
      text: 'R$\u00a012.345',
      /* Out of the prefix and onto the first character the reader owns. */
      caret: 3,
    });
  });

  it('leaves text that is not on its way to a number alone', () => {
    const format = createNumberFormat({ locale: 'pt-BR' });
    expect(format.formatWhileTyping({ text: '1,2,3', caret: 5 })).toEqual({
      text: '1,2,3',
      caret: 5,
    });
  });

  /**
   * Past fifteen digits a double stops holding the integer exactly, so a
   * regrouped text would stop being the text the reader typed. It is left
   * alone rather than silently rounded under the caret.
   */
  it('stops regrouping past the digits a double holds exactly', () => {
    const format = createNumberFormat({ locale: 'en-US' });
    expect(format.formatWhileTyping({ text: '123456789012345', caret: 15 }).text).toBe(
      '123,456,789,012,345',
    );
    expect(format.formatWhileTyping({ text: '1234567890123456', caret: 16 }).text).toBe(
      '1234567890123456',
    );
  });

  /**
   * A negative written as parentheses hides the sign the reader typed, and the
   * parser strips the brackets as affixes. Reshaping `-12` into `(R$ 12)`
   * leaves the next keystroke outside the bracket and the amount loses its
   * sign.
   */
  it('leaves an accounting sign to its commit', () => {
    const format = createNumberFormat({
      locale: 'pt-BR',
      options: { style: 'currency', currency: 'BRL', currencySign: 'accounting' },
    });
    expect(format.formatWhileTyping({ text: '-1234', caret: 5 }).text).toBe('-1234');
  });

  /** A format that rewrites the whole part itself has no shape to regroup into. */
  it('leaves a significant-digit format to its commit', () => {
    const format = createNumberFormat({
      locale: 'en-US',
      options: { maximumSignificantDigits: 3 },
    });
    expect(format.formatWhileTyping({ text: '1234', caret: 4 }).text).toBe('1234');
  });
});

/**
 * The defect every live-formatting field is measured by. Backspace against a
 * separator the family inserted deletes punctuation that the next regrouping
 * puts straight back, so the key does nothing and the reader presses it twice
 * to lose one digit.
 */
describe('deleteAcrossSeparator', () => {
  const format = createNumberFormat({ locale: 'en-US' });

  it('takes the digit the reader meant when the deletion took only a separator', () => {
    /* `1,234` with the caret after the comma; the browser removed the comma. */
    expect(format.deleteAcrossSeparator('1,234', { text: '1234', caret: 1 }, -1)).toEqual({
      text: '234',
      caret: 0,
    });
  });

  it('takes the character after the separator when the deletion went forward', () => {
    expect(format.deleteAcrossSeparator('1,234', { text: '1234', caret: 1 }, 1)).toEqual({
      text: '134',
      caret: 1,
    });
  });

  it("leaves a deletion that took something of the reader's own alone", () => {
    expect(format.deleteAcrossSeparator('1,234', { text: '1,23', caret: 4 }, -1)).toEqual({
      text: '1,23',
      caret: 4,
    });
  });

  it('leaves a deleted selection alone', () => {
    expect(format.deleteAcrossSeparator('1,234', { text: '1', caret: 1 }, -1)).toEqual({
      text: '1',
      caret: 1,
    });
  });
});

describe('stepNumber', () => {
  it('moves by one step in the direction asked', () => {
    expect(stepNumber({ value: 4, direction: 1, step: 1 })).toBe(5);
    expect(stepNumber({ value: 4, direction: -1, step: 1 })).toBe(3);
  });

  /** Binary floating point is not the reader's problem. */
  it('rounds to the decimals the step implies', () => {
    expect(stepNumber({ value: 0.1, direction: 1, step: 0.2 })).toBe(0.3);
    expect(stepNumber({ value: 1.005, direction: 1, step: 0.01 })).toBe(1.015);
  });

  it('holds the value inside the range it was given', () => {
    expect(stepNumber({ value: 9, direction: 1, step: 5, max: 10 })).toBe(10);
    expect(stepNumber({ value: 1, direction: -1, step: 5, min: 0 })).toBe(0);
  });

  /**
   * Pressing increment on an empty field has to produce a number, and the
   * number it produces is a decision rather than an accident: the start value,
   * not the start value plus a step.
   */
  it('starts an empty field at the value it was told to start from', () => {
    expect(stepNumber({ value: null, direction: 1, step: 1, stepFrom: 3 })).toBe(3);
    expect(stepNumber({ value: null, direction: -1, step: 1, stepFrom: 3 })).toBe(3);
    expect(stepNumber({ value: null, direction: 1, step: 1, min: 5 })).toBe(5);
    expect(stepNumber({ value: null, direction: 1, step: 1 })).toBe(0);
  });

  it('brings a start value outside the range back into it', () => {
    expect(stepNumber({ value: null, direction: 1, step: 1, stepFrom: 0, min: 5 })).toBe(5);
  });

  /** React Aria's rule: with min 2 and step 3 the valid values are 2, 5, 8, 11. */
  it('snaps to the multiples measured from the minimum when asked', () => {
    expect(stepNumber({ value: 4, direction: 1, step: 3, min: 2, snapToStep: true })).toBe(5);
    expect(stepNumber({ value: 4, direction: -1, step: 3, min: 2, snapToStep: true })).toBe(2);
  });

  it('leaves a value off the step alone when it was not asked to snap', () => {
    expect(stepNumber({ value: 4, direction: 1, step: 3, min: 2 })).toBe(7);
  });
});

describe('snapToStep', () => {
  it('takes the nearest multiple measured from the origin given', () => {
    expect(snapToStep(7, 3, 2)).toBe(8);
    expect(snapToStep(6, 3, 2)).toBe(5);
    expect(snapToStep(1.24, 0.5, 0)).toBe(1);
  });

  it('leaves the value alone when there is no step to snap to', () => {
    expect(snapToStep(7, 0, 0)).toBe(7);
  });
});

describe('decimalsOf', () => {
  it('counts the fraction digits a value is written with', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.25)).toBe(2);
    expect(decimalsOf(0.0089)).toBe(4);
  });

  /** A step written in exponent notation is still a step. */
  it('counts them through exponent notation', () => {
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(1e21)).toBe(0);
  });
});

describe('createScrub', () => {
  it('counts whole steps of travel and keeps the remainder', () => {
    const scrub = createScrub({ clientX: 100 });
    expect(scrub.steps(101)).toBe(0);
    expect(scrub.steps(103)).toBe(1);
    expect(scrub.steps(104)).toBe(1);
    expect(scrub.steps(98)).toBe(-3);
  });

  it('takes its sensitivity in pixels per step', () => {
    const scrub = createScrub({ clientX: 0, sensitivity: 10 });
    expect(scrub.steps(25)).toBe(2);
    expect(scrub.steps(30)).toBe(1);
  });

  it('steps up towards the inline end in a right-to-left document', () => {
    const scrub = createScrub({ clientX: 100, rtl: true });
    expect(scrub.steps(96)).toBe(2);
    expect(scrub.steps(100)).toBe(-2);
  });
});

describe('figureRuns', () => {
  const runs = (locale: string, options: Intl.NumberFormatOptions, value: number) =>
    figureRuns(new Intl.NumberFormat(locale, options).formatToParts(value));

  it('sets the symbol and the decimals apart from the whole units, in the locale’s order', () => {
    const brl = runs('pt-BR', { style: 'currency', currency: 'BRL' }, 1999.88);
    expect(brl.filter((run) => run.secondary).map((run) => run.text)).toEqual(['R$', ',88']);
    expect(brl.find((run) => !run.secondary)?.text.trim()).toBe('1.999');

    const eur = runs('de-DE', { style: 'currency', currency: 'EUR' }, 1999.88);
    expect(eur.at(-1)).toEqual({ text: '€', secondary: true });
  });

  it('joins back to the formatter’s own output', () => {
    const options = { style: 'currency', currency: 'BRL' } as const;
    expect(
      runs('pt-BR', options, -1999.88)
        .map((run) => run.text)
        .join(''),
    ).toBe(new Intl.NumberFormat('pt-BR', options).format(-1999.88));
  });
});
