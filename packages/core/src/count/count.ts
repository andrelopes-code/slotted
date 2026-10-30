/**
 * What a badge shows when it is given a number.
 *
 * The three decisions here — the ceiling above which a count becomes `99+`,
 * whether nought is a value or an absence, and which locale writes the digits —
 * are the ones every surveyed badge implementation takes, and each of them
 * takes them twice in this repository: once in React and once in Angular. Two
 * copies of a rule that must agree character for character is one copy too
 * many, which is why this is here rather than in either binding. `tag` and
 * `avatar-group` ship the same `+N` summary later in this wave and are the
 * callers that will confirm the shape.
 *
 * Nothing here touches the DOM or a framework.
 */

export interface CountFormat {
  /** The number the consumer owns. */
  count: number;
  /**
   * The largest number written in full. Above it the badge shows the ceiling
   * followed by `+`. `false` removes the ceiling, so a real total is shown
   * however long it is.
   */
  max?: number | false | undefined;
  /** Whether nought is a value worth showing or an absence worth hiding. */
  showZero?: boolean | undefined;
  /** BCP 47. Absent, the runtime's own default writes the digits. */
  locale?: string | undefined;
}

/**
 * One formatter per locale. A dense table renders hundreds of badges, and
 * `Intl.NumberFormat` is expensive enough to construct that building one per
 * badge per render is measurable.
 */
const formatters = new Map<string, Intl.NumberFormat>();

function format(value: number, locale: string | undefined) {
  const key = locale ?? '';
  let formatter = formatters.get(key);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale);
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}

/**
 * The text a badge renders for a count, or `undefined` when it renders nothing
 * at all.
 *
 * Nothing is not the same as an empty badge: a notification badge whose count
 * has fallen to nought leaves the corner rather than sitting there as a blank
 * circle, which is the behaviour Fluent, Ant Design and MUI all ship.
 *
 * A negative count is written out rather than clamped. It is not a number a
 * badge can mean, and showing it is how the page that produced it finds out.
 */
export function formatCount({ count, max = 99, showZero = false, locale }: CountFormat) {
  if (!Number.isFinite(count)) return undefined;
  if (count === 0 && !showZero) return undefined;
  if (max !== false && Number.isFinite(max) && count > (max as number)) {
    return `${format(max as number, locale)}+`;
  }
  return format(count, locale);
}
