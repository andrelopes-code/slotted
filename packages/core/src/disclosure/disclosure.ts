/**
 * What a set of disclosures does when one of them is asked to move.
 *
 * The arithmetic is here rather than in either binding because the two would
 * otherwise answer `multiple` and `requireOpen` separately, and no test could
 * prove the two answers agree. Nothing here touches the DOM, React or Angular.
 */

export interface OpenValuesOptions {
  /** Whether more than one value may be open at once. */
  multiple?: boolean;
  /**
   * Whether the set refuses to empty. With one value open and `multiple` off,
   * that value cannot be closed, and the APG asks the header that may not
   * close to carry `aria-disabled="true"`.
   */
  requireOpen?: boolean;
}

/** Whether `value` is currently open. */
export function isOpenValue(current: readonly string[], value: string): boolean {
  return current.includes(value);
}

/**
 * Whether `value` is open and may not be closed, which is the whole of what
 * `aria-disabled` says on an accordion header. It is false for a closed value,
 * because a header that can still open is not disabled.
 */
export function isHeldOpen(
  current: readonly string[],
  value: string,
  options: OpenValuesOptions = {},
): boolean {
  if (options.requireOpen !== true) return false;
  if (!isOpenValue(current, value)) return false;
  return current.length === 1;
}

/**
 * The set after `value` is toggled.
 *
 * Returns the same array reference when nothing moves, which is what lets a
 * caller skip a request the state model would refuse anyway: a request for a
 * value equal to the current one is not emitted.
 */
export function nextOpenValues(
  current: readonly string[],
  value: string,
  options: OpenValuesOptions = {},
): readonly string[] {
  const multiple = options.multiple ?? false;

  if (isOpenValue(current, value)) {
    if (isHeldOpen(current, value, options)) return current;
    return current.filter((candidate) => candidate !== value);
  }

  /**
   * Opening one closes the rest while only one may be open. The values that
   * leave are what the closing items are told, with the reason `select`: they
   * did not close because the reader asked them to.
   */
  if (!multiple) return [value];
  return [...current, value];
}

/**
 * The values that are open in `next` and were not in `previous`, and the ones
 * that were and are not. A binding hands each item its own transition from
 * this rather than each item comparing two arrays for itself.
 */
export function openValuesDelta(
  previous: readonly string[],
  next: readonly string[],
): { opened: readonly string[]; closed: readonly string[] } {
  return {
    opened: next.filter((value) => !previous.includes(value)),
    closed: previous.filter((value) => !next.includes(value)),
  };
}

/**
 * Two sets holding the same values, in any order.
 *
 * The state model compares with `Object.is` by default, which is never true for
 * two arrays, so a family whose value is a set states its own equality or emits
 * a request for every render.
 */
export function sameOpenValues(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value) => b.includes(value));
}
