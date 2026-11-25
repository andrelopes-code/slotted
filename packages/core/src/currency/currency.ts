/**
 * Reading and writing one amount of money, in one currency and one locale.
 *
 * It composes `@slotted/core/number` rather than repeating it: the parser is
 * still built from `Intl.NumberFormat.formatToParts`, so the group separator,
 * the decimal separator, the minus sign, the currency affix and the numbering
 * system all come from the formatter that writes the value back.
 *
 * Three things are this module's own, and each is a defect in the surveyed
 * field rather than an addition to it:
 *
 * 1. **The minor units come from the currency.** A yen has no cent and a dinar
 *    has three, and every mask-based implementation assumes two.
 * 2. **An accounting negative is read back as a negative.** `Intl` writes
 *    `($1,234.56)` and every surveyed parser reads it as a credit.
 * 3. **The cents-first entry model.** Digits enter at the minor unit and shift
 *    left, which is what a cash register does and what ngx-currency calls
 *    `Financial`. The caret is held by the count of digits on its right, which
 *    the generated separators do not change, so a digit in the middle of an
 *    amount is corrected where it stands. It lives here rather than in a
 *    binding, so React and Angular cannot disagree about what the fourth
 *    keystroke of `1234` means.
 *
 * Nothing here touches the DOM or a framework.
 */

import { roundTo } from '../measure';
import { createNumberFormat, digitsOf as localeDigits } from '../number';
import type { NumberFormat } from '../number';
import type { ChangeRequest } from '../state';

/**
 * Where a double stops holding a cent. Fifteen digits is the last length at
 * which every integer is exactly representable, and an amount past it would be
 * rounded without anyone being told.
 */
export const MAX_AMOUNT_DIGITS = 15;

/** `Intl`'s own ceiling for fraction digits, which the spec fixes at 100. */
const FRACTION_DIGIT_CEILING = 20;

/** What is written beside the amount, or `none` when nothing is. */
export type CurrencyDisplay = 'symbol' | 'narrowSymbol' | 'code' | 'name' | 'none';

export interface CurrencyFormatRequest {
  /** An ISO 4217 code: `BRL`, `USD`, `JPY`. It decides the minor units. */
  currency: string;
  /** BCP 47. Defaults to the runtime's own locale. */
  locale?: string | undefined;
  /**
   * How the currency is written beside the amount. Defaults to the symbol.
   *
   * `none` is this module's own, and it is not an `Intl` value: the amount is
   * written as a plain decimal with the currency's own fraction digits, so the
   * symbol can live in an adornment beside the value instead of inside it. It
   * is the one arrangement `Intl` has no option for, and the one every design
   * system reaches for as `prefix`.
   */
  currencyDisplay?: CurrencyDisplay | undefined;
  /** Overrides the currency's own minor units, for a unit price. */
  fractionDigits?: number | undefined;
  /** Anything else `Intl` takes. Every key here wins over the family's own. */
  options?: Intl.NumberFormatOptions | undefined;
}

export interface AmountEditRequest {
  /** What the element holds after the browser applied the edit. */
  text: string;
  /**
   * Where the caret stands in `text` after the browser applied the edit. The
   * digits on its right are kept whatever is typed before them, leading zeros
   * included. Left out, the caret is at the end: the cash register.
   */
  caret?: number | undefined;
  /**
   * What the element held before the browser applied the edit, with the caret
   * and no selection. A deletion that took a separator and no digit is read
   * from it, and erases the digit beside the separator.
   */
  previous?: string | undefined;
  /** `InputEvent.inputType`, which says whether this was a paste or a deletion. */
  inputType?: string | undefined;
  /** The sign the amount carried before the edit. */
  negative?: boolean | undefined;
  /** Whether a negative amount is admissible at all. */
  allowNegative?: boolean | undefined;
  /**
   * Whether an amount with no digits left in it is nothing, or nought.
   *
   * Off, because an amount is not an optional number: a total, a price and a
   * balance are all nought when nothing is in them, and a field that answered
   * `null` made every consumer write `value ?? 0`. A form where the amount is
   * genuinely absent turns it on.
   */
  allowEmpty?: boolean | undefined;
}

export interface AmountEdit {
  /** The amount in major units, or `null` when the field holds nothing. */
  value: number | null;
  /** The same amount as the integer a payment API is charged in. */
  minorUnits: number | null;
  /**
   * What the field shows until it is left: the amount, and the zeros on the
   * right of the caret that the amount alone would drop.
   */
  text: string;
  /** How many digits stand on the right of the caret. */
  right: number;
}

export interface CurrencyFormat extends NumberFormat {
  readonly currency: string;
  /** How many fraction digits this currency's minor unit occupies. */
  readonly minorUnits: number;
  /** The amount as an exact integer of minor units. */
  toMinorUnits(value: number | null): number | null;
  /** The integer read back as an amount. */
  fromMinorUnits(units: number | null): number | null;
  /** Every digit in the text, in Latin, whatever the locale writes them as. */
  digitsOf(text: string): string;
  /** How many digits of the text stand on the right of a position in it. */
  digitsAfter(text: string, caret: number): number;
  /** The position with that many digits on its right, against the digit on its left. */
  caretAt(text: string, right: number): number;
  /** What the text the browser produced means, under cents-first entry. */
  editFromText(request: AmountEditRequest): AmountEdit;
}

/**
 * A change request over an amount, which carries two things a number's request
 * cannot: the currency the amount is in, and the exact integer of minor units.
 * A consumer who had to write `Math.round(value * 100)` would lose a cent on
 * every half, which is the defect the integer exists to prevent.
 */
export interface CurrencyChangeRequest extends ChangeRequest<number | null> {
  readonly currency: string;
  readonly minorUnits: number | null;
}

/**
 * The request, with the amount's two extra facts on it.
 *
 * The original is the prototype rather than a source to copy: `cancelled` is a
 * getter and `cancel()` closes over the request's own state, and a spread would
 * hand the consumer a snapshot that never changes and a cancellation that
 * cancels nothing.
 */
export function withAmount(
  request: ChangeRequest<number | null>,
  currency: string,
  minorUnits: number | null,
): CurrencyChangeRequest {
  return Object.defineProperties(Object.create(request) as CurrencyChangeRequest, {
    currency: { enumerable: true, value: currency },
    minorUnits: { enumerable: true, value: minorUnits },
  });
}

/**
 * The unit a consumer holds an amount in. `major` is a number of whole
 * currency units, `12.34`; `minor` is an integer of the currency's minor unit,
 * `1234`, the shape a ledger stores so that no sum goes through a float.
 */
export type CurrencyUnit = 'major' | 'minor';

/**
 * An amount, a bound or a step the consumer wrote in `unit`, in the major units
 * the family computes in. The minor unit is the format's, so `fractionDigits`
 * decides it when set.
 */
export function amountFromUnit<T extends number | null | undefined>(
  amount: T,
  unit: CurrencyUnit,
  format: CurrencyFormat,
): T {
  return (
    unit === 'minor' && typeof amount === 'number' ? amount / 10 ** format.minorUnits : amount
  ) as T;
}

/**
 * The request in the consumer's unit: under `minor`, `value` is the exact
 * integer the request already carries and `previous` the integer of the amount
 * it replaces. Built on the original like `withAmount`, so `cancel()` still
 * cancels it.
 */
export function requestInUnit(
  request: CurrencyChangeRequest,
  unit: CurrencyUnit,
  format: CurrencyFormat,
): CurrencyChangeRequest {
  if (unit === 'major') return request;
  return Object.defineProperties(Object.create(request) as CurrencyChangeRequest, {
    value: { enumerable: true, value: request.minorUnits },
    previous: { enumerable: true, value: format.toMinorUnits(request.previous) },
  });
}

/**
 * The fraction digits ISO 4217 gives this currency, read through `Intl` rather
 * than through a table this module would have to maintain.
 */
function minorUnitsOf(locale: string | undefined, currency: string) {
  const probe = new Intl.NumberFormat(locale, { style: 'currency', currency });
  return probe.resolvedOptions().maximumFractionDigits ?? 2;
}

/**
 * A parenthesised amount, unwrapped. `Intl` writes `($1,234.56)` under
 * `currencySign: 'accounting'`, and a reader pastes it back into the field it
 * was copied from. The wrapping is recognized whether or not this format is the
 * one that wrote it: a ledger export and a plain field are the same string.
 */
function unwrapAccounting(text: string) {
  const trimmed = text.trim();
  const wrapped = trimmed.startsWith('(') && trimmed.endsWith(')') && trimmed.length > 2;
  return { text: wrapped ? trimmed.slice(1, -1) : trimmed, negative: wrapped };
}

/** What a locale writes for a currency beside an amount, and on which side. */
export interface CurrencyAffix {
  readonly text: string;
  readonly position: 'start' | 'end';
}

/**
 * The currency's mark as the locale writes it, and the side of the amount it
 * stands on: `R$` before the amount in `pt-BR`, `€` after it in `de-DE`. A
 * field that draws the mark apart from the digits — at a smaller step, in a
 * muted ink — reads it here rather than splitting a formatted string.
 */
export function currencyAffix({
  currency,
  currencyDisplay,
  locale,
}: {
  currency: string;
  currencyDisplay?: CurrencyDisplay | undefined;
  locale?: string | undefined;
}): CurrencyAffix | null {
  if (currencyDisplay === 'none') return null;
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...(currencyDisplay === undefined ? {} : { currencyDisplay }),
  }).formatToParts(1);
  const mark = parts.findIndex((part) => part.type === 'currency');
  const amount = parts.findIndex((part) => part.type === 'integer');
  if (mark < 0) return null;
  return { text: parts[mark]!.value, position: mark < amount ? 'start' : 'end' };
}

export function createCurrencyFormat({
  currency,
  currencyDisplay,
  fractionDigits,
  locale,
  options,
}: CurrencyFormatRequest): CurrencyFormat {
  const digits = fractionDigits ?? minorUnitsOf(locale, currency);
  const bare = currencyDisplay === 'none';

  /**
   * The family states the digits and the display; the consumer's own options
   * are laid over them; the style is laid over everything, because a currency
   * field that formatted a percentage would not be one.
   *
   * Under `none` the style is `decimal` and no currency reaches `Intl` at all:
   * the code still decides the fraction digits — and therefore the shift — but
   * nothing about it is written into the string.
   */
  const composed: Intl.NumberFormatOptions = bare
    ? {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        ...options,
        style: 'decimal',
      }
    : {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        ...(currencyDisplay === undefined ? {} : { currencyDisplay }),
        ...options,
        style: 'currency',
        currency,
      };

  const base = createNumberFormat({
    ...(locale === undefined ? {} : { locale }),
    options: composed,
  });

  /**
   * A format that rounds by significant digits leaves the fraction count
   * unresolved, and `createNumberFormat` answers that absence with the
   * platform ceiling. A shift of one hundred places is not what the currency
   * means, so the currency's own count stands in.
   */
  const minorUnits =
    base.maximumFractionDigits > FRACTION_DIGIT_CEILING ? digits : base.maximumFractionDigits;

  const scale = 10 ** minorUnits;

  const latin = new Map<string, string>();
  localeDigits(base.locale).forEach((digit, index) => latin.set(digit, String(index)));

  const digitsOf = (text: string) => {
    let extracted = '';
    for (const character of text) {
      if (character >= '0' && character <= '9') {
        extracted += character;
        continue;
      }
      const mapped = latin.get(character);
      if (mapped !== undefined) extracted += mapped;
    }
    return extracted;
  };

  const fromMinorUnits = (units: number | null) =>
    units === null ? null : roundTo(units / scale, minorUnits);

  /**
   * Rounded away from nought rather than towards positive infinity, so a debit
   * and a credit of the same half cent round to the same magnitude. The value
   * is fixed before it is rounded because `1.005 * 100` is `100.49999…`, and
   * `Math.round` of that is where a consumer loses a cent.
   */
  const toMinorUnits = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return null;
    const shifted = Number((value * scale).toFixed(6));
    return Math.sign(shifted) * Math.round(Math.abs(shifted));
  };

  const own = localeDigits(base.locale);

  /**
   * A digit run as the field shows it, its leading zeros included: a run the
   * amount alone would shorten is written over an amount as long, so `000000`
   * takes the grouping of `1.000,00` and reads `0.000,00`.
   */
  const formatRun = (run: string, signed: number) => {
    const canonical = base.format(fromMinorUnits(signed));
    if (digitsOf(canonical).length >= run.length) return canonical;

    const longest = Number(`1${run.slice(1)}`);
    const template = base.format(fromMinorUnits(signed < 0 ? -longest : longest));
    if (digitsOf(template).length !== run.length) return canonical;

    let index = 0;
    return [...template]
      .map((character) => (digitsOf(character) === '' ? character : own[Number(run[index++])]))
      .join('');
  };

  const digitsAfter = (text: string, caret: number) => digitsOf(text.slice(caret)).length;

  const caretAt = (text: string, right: number) => {
    let first = -1;
    let seen = 0;
    for (let index = text.length - 1; index >= 0; index -= 1) {
      if (digitsOf(text[index]!) === '') continue;
      if (seen === right) return index + 1;
      seen += 1;
      first = index;
    }
    return first < 0 ? text.length : first;
  };

  return {
    ...base,
    currency,
    minorUnits,
    digitsOf,
    digitsAfter,
    caretAt,
    fromMinorUnits,
    toMinorUnits,

    parse(text) {
      const { text: unwrapped, negative } = unwrapAccounting(text);
      const parsed = base.parse(unwrapped);
      if (parsed === null) return null;
      return negative ? -parsed : parsed;
    },

    isPartial(text) {
      return base.isPartial(unwrapAccounting(text).text);
    },

    editFromText({
      text,
      caret = text.length,
      previous,
      inputType,
      negative = false,
      allowNegative = true,
      allowEmpty = false,
    }) {
      /**
       * The one case where the cash-register rule would lose the reader's data:
       * `R$ 1.480,00` copied from a bank statement is one thousand four hundred
       * and eighty, not fourteen and eighty. A paste that means nothing on its
       * own falls through to its digits.
       */
      if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
        const { text: unwrapped, negative: parenthesised } = unwrapAccounting(text);
        const parsed = base.parse(unwrapped);
        if (parsed !== null) {
          const signed = parenthesised ? -parsed : parsed;
          const held = allowNegative ? signed : Math.abs(signed);
          return {
            value: held,
            minorUnits: toMinorUnits(held),
            text: base.format(held),
            right: 0,
          };
        }
      }

      let left = digitsOf(text.slice(0, caret));
      let right = digitsOf(text.slice(caret));
      if (previous !== undefined && digitsOf(previous) === left + right) {
        if (inputType === 'deleteContentBackward') left = left.slice(0, -1);
        if (inputType === 'deleteContentForward') right = right.slice(1);
      }
      if (left + right === '' && allowEmpty) {
        return { value: null, minorUnits: null, text: '', right: 0 };
      }

      /* Nought at the front says nothing; on the caret's right it is a digit
         of the amount being corrected. Past the length limit the digits on the
         right are the ones kept. */
      right = right.slice(-MAX_AMOUNT_DIGITS);
      left = left.replace(/^0+/, '').slice(0, MAX_AMOUNT_DIGITS - right.length);
      const run = (left + right).padStart(minorUnits + 1, '0');

      const magnitude = Number(run);
      /* Nought has no sign: `-0` and `0` are one amount written two ways. */
      const signed = magnitude === 0 || !negative || !allowNegative ? magnitude : -magnitude;
      return {
        value: fromMinorUnits(signed),
        minorUnits: signed,
        text: formatRun(run, signed),
        right: right.length,
      };
    },
  };
}
