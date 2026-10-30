import { describe, expect, it } from 'vitest';

import { formatCount } from './index';

describe('formatCount', () => {
  it('writes a count that fits under the ceiling in full', () => {
    expect(formatCount({ count: 4 })).toBe('4');
    expect(formatCount({ count: 99 })).toBe('99');
  });

  it('marks a count above the ceiling with the ceiling and a plus', () => {
    expect(formatCount({ count: 100 })).toBe('99+');
    expect(formatCount({ count: 1200, max: 9 })).toBe('9+');
  });

  it('writes the real total when the ceiling is removed', () => {
    expect(formatCount({ count: 1234, max: false, locale: 'en-US' })).toBe('1,234');
  });

  /**
   * Nothing, not an empty badge: a notification count that has fallen to nought
   * leaves the corner rather than sitting there as a blank circle. Fluent, Ant
   * Design and MUI all hide it, and all three let the page say otherwise.
   */
  it('renders nothing at nought unless nought is a value', () => {
    expect(formatCount({ count: 0 })).toBeUndefined();
    expect(formatCount({ count: 0, showZero: true })).toBe('0');
  });

  /**
   * Every surveyed implementation interpolates the raw number, so a count of
   * 1234 reads `1234` in every locale they ship to.
   */
  it('writes the digits the locale writes', () => {
    expect(formatCount({ count: 1234, max: false, locale: 'de-DE' })).toBe('1.234');
    /* French groups with a narrow no-break space, which is not the one typed here. */
    expect(formatCount({ count: 1234, max: false, locale: 'fr-FR' })?.replace(/\s/g, ' ')).toBe(
      '1 234',
    );
  });

  it('formats the ceiling in the same locale as the count', () => {
    expect(formatCount({ count: 5000, max: 1000, locale: 'de-DE' })).toBe('1.000+');
  });

  /** Not a number a badge can mean, and showing it is how the page finds out. */
  it('writes a negative count out rather than clamping it away', () => {
    expect(formatCount({ count: -3, locale: 'en-US' })).toBe('-3');
  });

  it('renders nothing for a value that is not a number', () => {
    expect(formatCount({ count: Number.NaN })).toBeUndefined();
    expect(formatCount({ count: Number.POSITIVE_INFINITY })).toBeUndefined();
  });
});
