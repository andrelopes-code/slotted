import type { Quantity, QuantityPrecision, SignedQuantity } from './common';

const QUANTITY_PATTERN = /^-?\d+(\.\d{1,3})?$/;

/** Parses a decimal quantity string into integer thousandths. */
export function quantityToMilli(value: Quantity | SignedQuantity): number {
  let index = 0;
  let negative = false;
  if (value.charCodeAt(0) === 45) {
    negative = true;
    index = 1;
  }
  let whole = 0;
  let digits = 0;
  for (; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code === 46) break;
    if (code < 48 || code > 57) throw new RangeError(`Invalid quantity: ${JSON.stringify(value)}`);
    whole = whole * 10 + (code - 48);
    digits += 1;
  }
  if (digits === 0) throw new RangeError(`Invalid quantity: ${JSON.stringify(value)}`);
  let milli = whole * 1000;
  if (index < value.length) {
    index += 1;
    let scale = 100;
    let fractionDigits = 0;
    for (; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      if (code < 48 || code > 57 || fractionDigits === 3)
        throw new RangeError(`Invalid quantity: ${JSON.stringify(value)}`);
      milli += (code - 48) * scale;
      scale /= 10;
      fractionDigits += 1;
    }
    if (fractionDigits === 0) throw new RangeError(`Invalid quantity: ${JSON.stringify(value)}`);
  }
  return negative ? -milli : milli;
}

/** Renders integer thousandths as a canonical quantity string with the given precision. */
export function milliToQuantity(milli: number, precision: QuantityPrecision = 3): SignedQuantity {
  if (milli % 1000 === 0) return String(milli / 1000);
  const negative = milli < 0;
  const absolute = Math.abs(milli);
  const whole = Math.floor(absolute / 1000);
  const fraction = String(absolute % 1000)
    .padStart(3, '0')
    .slice(0, precision);
  const trimmed = fraction.replace(/0+$/, '');
  return `${negative && (whole !== 0 || trimmed !== '') ? '-' : ''}${whole}${trimmed ? `.${trimmed}` : ''}`;
}

export function quantity(value: number, precision: QuantityPrecision = 0): Quantity {
  return milliToQuantity(Math.round(value * 1000), precision);
}

export function quantityFractionDigits(value: Quantity): number {
  const index = value.indexOf('.');
  return index === -1 ? 0 : value.length - index - 1;
}

export function quantityFitsPrecision(value: Quantity, precision: QuantityPrecision): boolean {
  return QUANTITY_PATTERN.test(value) && quantityFractionDigits(value) <= precision;
}

export function addQuantity(a: Quantity, b: Quantity): SignedQuantity {
  return milliToQuantity(quantityToMilli(a) + quantityToMilli(b));
}

export function subtractQuantity(a: Quantity, b: Quantity): SignedQuantity {
  return milliToQuantity(quantityToMilli(a) - quantityToMilli(b));
}

export function sumQuantities(values: readonly Quantity[]): SignedQuantity {
  let milli = 0;
  for (const value of values) milli += quantityToMilli(value);
  return milliToQuantity(milli);
}

export function compareQuantity(a: Quantity, b: Quantity): number {
  return quantityToMilli(a) - quantityToMilli(b);
}

export function minQuantity(a: Quantity, b: Quantity): Quantity {
  return compareQuantity(a, b) <= 0 ? a : b;
}

export function maxQuantity(a: Quantity, b: Quantity): Quantity {
  return compareQuantity(a, b) >= 0 ? a : b;
}

export function isPositiveQuantity(value: Quantity): boolean {
  return quantityToMilli(value) > 0;
}

export function isZeroQuantity(value: Quantity): boolean {
  return quantityToMilli(value) === 0;
}

export const ZERO_QUANTITY: Quantity = '0';
