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
 *    `Financial`. It lives here rather than in a binding, so React and Angular
 *    cannot disagree about what the fourth keystroke of `1234` means.
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
   * What it held before the browser applied it. Given both, the digits the
   * reader added or took away are read from the difference between the two
   * runs rather than from where the caret was, which is what makes the caret
   * irrelevant to the amount.
   *
   * Left out, the digits of `text` are the run, which is what a text with no
   * edit behind it means.
   */
  previous?: string | undefined;
  /** `InputEvent.inputType`, which is what says whether this was a paste. */
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
 * The digit run a keystroke leaves behind, under the cash register's rule:
 * whatever the reader took out comes off the right, and whatever they put in
 * goes on the right, wherever the caret actually was.
 *
 * The two runs are compared from both ends. What they share at the front and
 * at the back is what the edit did not touch; what is left in the middle of
 * `before` is what went, and what is left in the middle of `after` is what
 * came. A selection replaced by a digit is therefore a removal and an
 * insertion in one keystroke, which is why the two are counted separately
 * rather than from the change in length.
 *
 * `0,00` with the caret at the front and `2` pressed gives `2000` here and
 * `0002` — two cents — as the run, because the `2` that appeared at the front
 * is the middle of `after` and it is appended rather than left where it fell.
 */
export function shiftIntoRun(before: string, after: string): string {
  const shortest = Math.min(before.length, after.length);

  let head = 0;
  while (head < shortest && before[head] === after[head]) head += 1;

  let tail = 0;
  while (
    tail < shortest - head &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  ) {
    tail += 1;
  }

  const removed = before.length - head - tail;
  const inserted = after.slice(head, after.length - tail);
  return before.slice(0, before.length - removed) + inserted;
}

/**
 * A parenthesised amount, unwrapped. `Intl` writes `($1,234.56)` under
 * `currencySign: 'accounting'`, and a reader pastes it back into the field it
 * was copied from. The wrapping is recognised whether or not this format is the
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

  return {
    ...base,
    currency,
    minorUnits,
    digitsOf,
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
          return { value: held, minorUnits: toMinorUnits(held) };
        }
      }

      const run =
        previous === undefined ? digitsOf(text) : shiftIntoRun(digitsOf(previous), digitsOf(text));
      const accumulated = run.slice(0, MAX_AMOUNT_DIGITS);
      if (accumulated === '') {
        return allowEmpty ? { value: null, minorUnits: null } : { value: 0, minorUnits: 0 };
      }

      const magnitude = Number(accumulated);
      /* Nought has no sign: `-0` and `0` are one amount written two ways. */
      const signed = magnitude === 0 || !negative || !allowNegative ? magnitude : -magnitude;
      return { value: fromMinorUnits(signed), minorUnits: signed };
    },
  };
}
