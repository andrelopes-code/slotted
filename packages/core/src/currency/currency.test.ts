import { describe, expect, it } from 'vitest';

import { createControllable } from '../state';
import {
  amountFromUnit,
  createCurrencyFormat,
  currencyAffix,
  MAX_AMOUNT_DIGITS,
  requestInUnit,
  shiftIntoRun,
  withAmount,
} from './index';
import type { CurrencyChangeRequest } from './index';

describe('createCurrencyFormat', () => {
  it('writes the symbol the currency names and the separators the locale writes', () => {
    /* The space `pt-BR` writes after the symbol is a non-breaking one, and a
       test that wrote a plain space would be testing a string nobody sees. */
    expect(createCurrencyFormat({ locale: 'pt-BR', currency: 'BRL' }).format(1480)).toBe(
      'R$\u00a01.480,00',
    );
    expect(createCurrencyFormat({ locale: 'en-US', currency: 'USD' }).format(1480)).toBe(
      '$1,480.00',
    );
  });

  /**
   * The combination ngx-currency and react-currency-input make their consumers
   * assemble by hand: Brazilian separators around an American currency.
   */
  it('lets the locale and the currency disagree', () => {
    const field = createCurrencyFormat({ locale: 'pt-BR', currency: 'USD' });

    expect(field.format(1480)).toBe('US$\u00a01.480,00');
    expect(field.parse('US$ 1.480,00')).toBe(1480);
  });

  it('reads back a formatted amount, and a bare number, in either locale', () => {
    const brazil = createCurrencyFormat({ locale: 'pt-BR', currency: 'BRL' });
    expect(brazil.parse('R$\u00a01.480,00')).toBe(1480);
    /* Pasted from somewhere that wrote a plain space instead. */
    expect(brazil.parse('R$ 1.480,00')).toBe(1480);
    expect(brazil.parse('1480')).toBe(1480);

    const states = createCurrencyFormat({ locale: 'en-US', currency: 'USD' });
    expect(states.parse('$1,480.00')).toBe(1480);
  });

  /**
   * The minor units come from ISO 4217 through `Intl`, never from an assumed
   * two: a yen has no cent and a dinar has three.
   */
  it('takes its fraction digits from the currency', () => {
    expect(createCurrencyFormat({ locale: 'pt-BR', currency: 'BRL' }).minorUnits).toBe(2);
    expect(createCurrencyFormat({ locale: 'ja-JP', currency: 'JPY' }).minorUnits).toBe(0);
    expect(createCurrencyFormat({ locale: 'ar-KW', currency: 'KWD' }).minorUnits).toBe(3);
  });

  it('lets a unit price override the currency default', () => {
    const price = createCurrencyFormat({ locale: 'en-US', currency: 'USD', fractionDigits: 4 });

    expect(price.minorUnits).toBe(4);
    expect(price.format(1.2345)).toBe('$1.2345');
  });

  it('reports which currency it writes', () => {
    expect(createCurrencyFormat({ locale: 'en-US', currency: 'USD' }).currency).toBe('USD');
  });

  /**
   * `Intl` writes a negative accounting amount in parentheses, and every
   * surveyed parser reads it back as a credit. A debit that changes sign when
   * it is pasted back into the field it came from is a defect that costs money.
   */
  it('reads an accounting negative back as a negative', () => {
    const ledger = createCurrencyFormat({
      locale: 'en-US',
      currency: 'USD',
      options: { currencySign: 'accounting' },
    });

    expect(ledger.format(-1234.56)).toBe('($1,234.56)');
    expect(ledger.parse('($1,234.56)')).toBe(-1234.56);
    expect(ledger.parse(ledger.format(-1234.56))).toBe(-1234.56);
  });

  it('reads a parenthesised amount even when the format does not write one', () => {
    expect(createCurrencyFormat({ locale: 'en-US', currency: 'USD' }).parse('($1,234.56)')).toBe(
      -1234.56,
    );
  });

  it('writes the display the consumer asked for', () => {
    expect(
      createCurrencyFormat({ locale: 'en-US', currency: 'USD', currencyDisplay: 'code' }).format(
        12,
      ),
    ).toContain('USD');
    expect(
      createCurrencyFormat({
        locale: 'en-US',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
      }).format(12),
    ).toBe('$12.00');
  });

  /**
   * The one arrangement `Intl` has no option for: the symbol lives in an
   * adornment beside the value, so nothing about the currency is written into
   * the string — and the code still decides the fraction digits.
   */
  it('writes no currency at all under the display that has none', () => {
    const bare = createCurrencyFormat({
      locale: 'pt-BR',
      currency: 'BRL',
      currencyDisplay: 'none',
    });

    expect(bare.format(1480)).toBe('1.480,00');
    expect(bare.minorUnits).toBe(2);
    expect(bare.parse('1.480,00')).toBe(1480);
    expect(bare.editFromText({ text: '1234' })).toEqual({ value: 12.34, minorUnits: 1234 });

    const yen = createCurrencyFormat({ locale: 'pt-BR', currency: 'JPY', currencyDisplay: 'none' });
    expect(yen.format(1480)).toBe('1.480');
    expect(yen.minorUnits).toBe(0);
  });

  it('lets an option the consumer wrote win over the family default', () => {
    const plain = createCurrencyFormat({
      locale: 'en-US',
      currency: 'USD',
      options: { useGrouping: false },
    });

    expect(plain.format(1480)).toBe('$1480.00');
  });
});

describe('minor units', () => {
  it('converts an amount to the integer a payment API is charged in', () => {
    const brazil = createCurrencyFormat({ locale: 'pt-BR', currency: 'BRL' });

    expect(brazil.toMinorUnits(1480.5)).toBe(148050);
    expect(brazil.toMinorUnits(0)).toBe(0);
    expect(brazil.toMinorUnits(null)).toBe(null);
  });

  /**
   * `Math.round(1.005 * 100)` is 100, because the double below `1.005` is
   * `1.00499…`. The consumer who writes that line loses a cent; this is why
   * the request carries the integer instead.
   */
  it('rounds a half cent up rather than down into the float', () => {
    expect(createCurrencyFormat({ locale: 'en-US', currency: 'USD' }).toMinorUnits(1.005)).toBe(
      101,
    );
  });

  it('counts a currency with no cent and one with three', () => {
    expect(createCurrencyFormat({ locale: 'ja-JP', currency: 'JPY' }).toMinorUnits(1480)).toBe(
      1480,
    );
    expect(createCurrencyFormat({ locale: 'ar-KW', currency: 'KWD' }).toMinorUnits(1.234)).toBe(
      1234,
    );
  });

  it('comes back to the amount it started from', () => {
    const brazil = createCurrencyFormat({ locale: 'pt-BR', currency: 'BRL' });

    expect(brazil.fromMinorUnits(148050)).toBe(1480.5);
    expect(brazil.fromMinorUnits(1)).toBe(0.01);
    expect(brazil.fromMinorUnits(null)).toBe(null);
  });
});

describe('cents-first entry', () => {
  const brazil = createCurrencyFormat({ locale: 'pt-BR', currency: 'BRL' });

  /** The cash register: digits enter at the cent and shift left. */
  it('shifts each digit left by the currency minor units', () => {
    expect(brazil.editFromText({ text: '1' })).toEqual({ value: 0.01, minorUnits: 1 });
    expect(brazil.editFromText({ text: '12' })).toEqual({ value: 0.12, minorUnits: 12 });
    expect(brazil.editFromText({ text: '123' })).toEqual({ value: 1.23, minorUnits: 123 });
    expect(brazil.editFromText({ text: '1234' })).toEqual({ value: 12.34, minorUnits: 1234 });
  });

  it('ignores every separator and affix the formatter wrote', () => {
    expect(brazil.editFromText({ text: 'R$ 12,34' })).toEqual({ value: 12.34, minorUnits: 1234 });
    expect(brazil.editFromText({ text: 'R$ 1.234,56' })).toEqual({
      value: 1234.56,
      minorUnits: 123456,
    });
  });

  /** What the family does after every keystroke: read its own output back. */
  it('reads back what it formats, so a keystroke is idempotent', () => {
    for (const amount of [0.01, 12.34, 1480.5, 987654.32]) {
      expect(brazil.editFromText({ text: brazil.format(amount) }).value).toBe(amount);
    }
  });

  /**
   * An emptied amount is nought, because an amount is not an optional number.
   * A form where it is genuinely absent asks for that with `allowEmpty`.
   */
  it('empties to nought, and to nothing only when nothing is allowed', () => {
    expect(brazil.editFromText({ text: '' })).toEqual({ value: 0, minorUnits: 0 });
    expect(brazil.editFromText({ text: 'R$ ' })).toEqual({ value: 0, minorUnits: 0 });

    expect(brazil.editFromText({ text: '', allowEmpty: true })).toEqual({
      value: null,
      minorUnits: null,
    });
    expect(brazil.editFromText({ text: 'R$ ', allowEmpty: true })).toEqual({
      value: null,
      minorUnits: null,
    });
  });

  it('keeps a nought a reader actually typed', () => {
    expect(brazil.editFromText({ text: '0' })).toEqual({ value: 0, minorUnits: 0 });
  });

  /**
   * The caret, given the text before the edit as well as the text after it.
   * Every case here is one the reader can produce from `R$ 12,34` without
   * moving anything but the caret, and every one of them ends at the right.
   */
  describe('where the caret was', () => {
    const before = 'R$ 12,34';

    it('takes a digit typed against the first character at the right', () => {
      expect(brazil.editFromText({ previous: before, text: 'R$ 912,34' })).toEqual({
        value: 123.49,
        minorUnits: 12349,
      });
    });

    it('takes a digit typed into the middle at the right', () => {
      expect(brazil.editFromText({ previous: before, text: 'R$ 12,934' })).toEqual({
        value: 123.49,
        minorUnits: 12349,
      });
    });

    it('takes the digit at the right off, whatever the caret was against', () => {
      expect(brazil.editFromText({ previous: before, text: 'R$ 1,34' })).toEqual({
        value: 1.23,
        minorUnits: 123,
      });
      expect(brazil.editFromText({ previous: before, text: 'R$ 12,4' })).toEqual({
        value: 1.23,
        minorUnits: 123,
      });
    });

    it('replaces a selection at the right rather than where it stood', () => {
      /* `5` typed over `2,3`: two digits went, one came. */
      expect(brazil.editFromText({ previous: before, text: 'R$ 154' })).toEqual({
        value: 1.25,
        minorUnits: 125,
      });
    });

    it('empties the run when the whole amount is deleted at once', () => {
      expect(brazil.editFromText({ previous: before, text: '' })).toEqual({
        value: 0,
        minorUnits: 0,
      });
      expect(brazil.editFromText({ previous: before, text: '', allowEmpty: true })).toEqual({
        value: null,
        minorUnits: null,
      });
    });

    it('reads the text alone when there is no text behind it', () => {
      expect(brazil.editFromText({ text: 'R$ 912,34' })).toEqual({
        value: 912.34,
        minorUnits: 91234,
      });
    });
  });

  /**
   * The rule itself, over runs rather than over amounts: what the two runs
   * share at either end is what the edit did not touch, and the middle of each
   * is what went and what came.
   */
  describe('shiftIntoRun', () => {
    it('appends what came, wherever it appeared', () => {
      expect(shiftIntoRun('000', '2000')).toBe('0002');
      expect(shiftIntoRun('1234', '12934')).toBe('12349');
      expect(shiftIntoRun('1234', '12345')).toBe('12345');
      expect(shiftIntoRun('', '5')).toBe('5');
    });

    it('takes off what went, from the right', () => {
      expect(shiftIntoRun('1234', '134')).toBe('123');
      expect(shiftIntoRun('1234', '123')).toBe('123');
      expect(shiftIntoRun('1234', '')).toBe('');
    });

    it('counts a replacement as both, in one keystroke', () => {
      expect(shiftIntoRun('1234', '154')).toBe('125');
      expect(shiftIntoRun('1234', '9')).toBe('9');
    });

    it('leaves a run nothing happened to alone', () => {
      expect(shiftIntoRun('1234', '1234')).toBe('1234');
      expect(shiftIntoRun('', '')).toBe('');
    });
  });

  it('carries the sign the family holds rather than reading it from the text', () => {
    expect(brazil.editFromText({ text: '1234', negative: true })).toEqual({
      value: -12.34,
      minorUnits: -1234,
    });
    expect(brazil.editFromText({ text: '1234', negative: true, allowNegative: false })).toEqual({
      value: 12.34,
      minorUnits: 1234,
    });
  });

  /**
   * The one case where the cash-register rule would lose the reader's data:
   * an amount copied from a bank statement is not a run of digits.
   */
  it('parses a paste instead of accumulating its digits', () => {
    expect(brazil.editFromText({ text: 'R$\u00a01.480,00', inputType: 'insertFromPaste' })).toEqual(
      {
        value: 1480,
        minorUnits: 148000,
      },
    );
  });

  it('falls back to the digits when a paste means nothing on its own', () => {
    expect(brazil.editFromText({ text: 'nota 12', inputType: 'insertFromPaste' })).toEqual({
      value: 0.12,
      minorUnits: 12,
    });
  });

  it('shifts by nothing in a currency with no cent', () => {
    const japan = createCurrencyFormat({ locale: 'ja-JP', currency: 'JPY' });

    expect(japan.editFromText({ text: '1234' })).toEqual({ value: 1234, minorUnits: 1234 });
  });

  it('shifts by three in a currency with three', () => {
    const kuwait = createCurrencyFormat({ locale: 'ar-KW', currency: 'KWD' });

    expect(kuwait.editFromText({ text: '1234' })).toEqual({ value: 1.234, minorUnits: 1234 });
  });

  /** A numbering system is part of the locale, and the reader types in it. */
  it('reads the digits the locale writes as well as the Latin ones', () => {
    const egypt = createCurrencyFormat({ locale: 'ar-EG', currency: 'EGP' });

    expect(egypt.editFromText({ text: egypt.format(12.34) }).minorUnits).toBe(1234);
    expect(egypt.editFromText({ text: '1234' }).minorUnits).toBe(1234);
  });

  it('stops at the digit a double could not hold', () => {
    expect(MAX_AMOUNT_DIGITS).toBe(15);

    const long = '9'.repeat(MAX_AMOUNT_DIGITS + 3);
    expect(String(brazil.editFromText({ text: long }).minorUnits)).toHaveLength(MAX_AMOUNT_DIGITS);
  });

  it('says how many digits a text already holds', () => {
    expect(brazil.digitsOf('R$ 1.234,56')).toBe('123456');
    expect(brazil.digitsOf('R$ ')).toBe('');
  });
});

describe('the request an amount carries', () => {
  it('adds the currency and the minor units without breaking the request', () => {
    let seen: ReturnType<typeof withAmount> | undefined;
    const state = createControllable<number | null>({
      initial: null,
      onRequest: (request) => {
        seen = withAmount(request, 'BRL', 148050);
      },
    });

    state.request(1480.5, 'keyboard');

    expect(seen?.value).toBe(1480.5);
    expect(seen?.previous).toBe(null);
    expect(seen?.reason).toBe('keyboard');
    expect(seen?.currency).toBe('BRL');
    expect(seen?.minorUnits).toBe(148050);
  });

  /**
   * A spread would hand the consumer a `cancelled` that never changes and a
   * `cancel()` that cancels nothing, which is why the request is the prototype
   * rather than a source to copy.
   */
  it('still refuses the change it is asked to refuse', () => {
    const state = createControllable<number | null>({
      initial: null,
      onRequest: (request) => {
        const amount = withAmount(request, 'BRL', 148050);
        amount.cancel();
        expect(amount.cancelled).toBe(true);
      },
    });

    expect(state.request(1480.5, 'keyboard')).toBe(false);
    expect(state.value).toBe(null);
  });
});

describe('currencyAffix', () => {
  it('says what the locale writes for the currency and on which side of the amount', () => {
    expect(currencyAffix({ currency: 'BRL', locale: 'pt-BR' })).toEqual({
      text: 'R$',
      position: 'start',
    });
    expect(currencyAffix({ currency: 'EUR', locale: 'de-DE' })).toEqual({
      text: '€',
      position: 'end',
    });
    expect(currencyAffix({ currency: 'USD', currencyDisplay: 'code', locale: 'en-US' })).toEqual({
      text: 'USD',
      position: 'start',
    });
  });

  it('has nothing to say under none', () => {
    expect(currencyAffix({ currency: 'BRL', currencyDisplay: 'none', locale: 'pt-BR' })).toBeNull();
  });
});

describe('an amount held in minor units', () => {
  const real = createCurrencyFormat({ currency: 'BRL', locale: 'pt-BR' });
  const yen = createCurrencyFormat({ currency: 'JPY', locale: 'ja-JP' });

  it('reads an integer of the minor unit as major units, by the currency’s own digits', () => {
    expect(amountFromUnit(12345, 'minor', real)).toBe(123.45);
    expect(amountFromUnit(12345, 'minor', yen)).toBe(12345);
    expect(amountFromUnit(null, 'minor', real)).toBe(null);
    expect(amountFromUnit(undefined, 'minor', real)).toBe(undefined);
    expect(amountFromUnit(123.45, 'major', real)).toBe(123.45);
  });

  it('restates the request in minor units, and cancelling it still cancels', () => {
    let seen: CurrencyChangeRequest | undefined;
    const state = createControllable<number | null>({
      initial: 0.1,
      onRequest: (request) => {
        seen = requestInUnit(withAmount(request, 'BRL', 30), 'minor', real);
        seen.cancel();
      },
    });

    expect(state.request(0.3, 'keyboard')).toBe(false);
    expect(seen?.value).toBe(30);
    expect(seen?.previous).toBe(10);
    expect(seen?.minorUnits).toBe(30);
    expect(seen?.currency).toBe('BRL');
    expect(seen?.reason).toBe('keyboard');
    expect(seen?.cancelled).toBe(true);
  });
});
