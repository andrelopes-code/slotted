/**
 * Arithmetic three components share and none of them owns.
 *
 * ProgressBar wrote the first version of it inline, Splitter wrote a second,
 * and LoadingBar would have been the third. The rule is that a core module is
 * designed against a real caller's requirements and stays malleable until a
 * second caller confirms it; three callers with the same requirement is that
 * confirmation.
 *
 * Nothing here touches the DOM or a framework. It is arithmetic, and it is
 * here so that "a value outside the range is clamped, not rejected" means the
 * same thing everywhere the library says it.
 */

/** Holds `value` inside `min`…`max`. An inverted range collapses to `min`. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Rounds to `decimals` places and returns a number, not a string, so a value
 * meant for an attribute and a value meant for a style cannot disagree in
 * their last digit.
 */
export function roundTo(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

/**
 * Where `value` sits between `min` and `max`, as a percentage rounded to
 * `decimals` places. An empty range is nought percent rather than a division
 * by zero: a bar measured against nothing has made no progress.
 */
export function percentOf(value: number, min: number, max: number, decimals = 4) {
  const span = max - min;
  if (span <= 0) return 0;
  return roundTo((clamp(value, min, max) - min) * (100 / span), decimals);
}
