/**
 * A number as CSS reads it: five decimals at most, no exponent, no trailing
 * zeros. The evaluator rounds coefficients to the same five decimals, so the
 * browser and the evaluator compute with the same constants.
 */
export function fmt(value: number): string {
  const rounded = Number(value.toFixed(5));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}
