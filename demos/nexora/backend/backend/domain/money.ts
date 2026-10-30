import { FX_RATES_TO_USD, type CurrencyCode, type Money, type Quantity } from './common';
import { quantityToMilli } from './quantity';

/** Round-half-up to the nearest integer; symmetric for negatives (section 53.7). */
export function roundHalfUp(value: number): number {
  return value < 0 ? -Math.floor(-value + 0.5) : Math.floor(value + 0.5);
}

export function money(minor: number, currency: CurrencyCode = 'USD'): Money {
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`Money minor units must be a safe integer, received ${minor}`);
  }
  return { currency, minor };
}

export function usd(minor: number): Money {
  return money(minor, 'USD');
}

export function zeroMoney(currency: CurrencyCode = 'USD'): Money {
  return { currency, minor: 0 };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new RangeError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { currency: a.currency, minor: a.minor + b.minor };
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { currency: a.currency, minor: a.minor - b.minor };
}

export function sumMoney(values: readonly Money[], currency: CurrencyCode = 'USD'): Money {
  let minor = 0;
  for (const value of values) {
    if (value.currency !== currency) {
      throw new RangeError(`Currency mismatch: ${value.currency} vs ${currency}`);
    }
    minor += value.minor;
  }
  return { currency, minor };
}

export function negateMoney(value: Money): Money {
  return { currency: value.currency, minor: -value.minor };
}

export function maxMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return a.minor >= b.minor ? a : b;
}

export function compareMoney(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  return a.minor - b.minor;
}

export function isZeroMoney(value: Money): boolean {
  return value.minor === 0;
}

/** `unitPrice * quantity`, rounded half-up to minor units. */
export function multiplyMoneyByQuantity(unit: Money, quantity: Quantity): Money {
  const milli = quantityToMilli(quantity);
  return { currency: unit.currency, minor: roundHalfUp((unit.minor * milli) / 1000) };
}

/** `value * bps / 10000`, rounded half-up. */
export function applyBps(value: Money, bps: number): Money {
  return { currency: value.currency, minor: roundHalfUp((value.minor * bps) / 10_000) };
}

/** Basis points of `part` over `whole`; 0 when `whole` is zero. */
export function ratioBps(part: number, whole: number): number {
  return whole === 0 ? 0 : roundHalfUp((part / whole) * 10_000);
}

/** FX rates are decimal strings with up to 8 fractional digits (section 53.7). */
export function toUsd(value: Money, fxRateToUsd?: string): Money {
  if (value.currency === 'USD') return value;
  const rate = Number(fxRateToUsd ?? FX_RATES_TO_USD[value.currency]);
  return { currency: 'USD', minor: roundHalfUp(value.minor * rate) };
}

/** USD minor units of a document amount; the document rate wins over the seed table. */
export function usdMinor(value: Money, fxRateToUsd?: string): number {
  return toUsd(value, fxRateToUsd).minor;
}

/** Converts a USD amount into `currency` at the seed table rate (section 53.7). */
export function fromUsd(value: Money, currency: CurrencyCode): Money {
  if (currency === 'USD' || value.currency === currency) return value;
  return { currency, minor: roundHalfUp(value.minor / Number(FX_RATES_TO_USD[currency])) };
}

export function formatMoney(value: Money): string {
  const symbol = value.currency === 'USD' ? '$' : value.currency === 'EUR' ? '€' : '£';
  const sign = value.minor < 0 ? '-' : '';
  const absolute = Math.abs(value.minor);
  const units = Math.floor(absolute / 100);
  const cents = String(absolute % 100).padStart(2, '0');
  return `${sign}${symbol}${units.toLocaleString('en-US')}.${cents}`;
}
