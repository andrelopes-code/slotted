import { describe, expect, it } from 'vitest';

import { defaultTail, graphemes, truncateMiddle } from './index';

const within = (max: number) => (candidate: string) => graphemes(candidate).length <= max;

describe('truncateMiddle', () => {
  it('returns the text untouched when it fits', () => {
    expect(truncateMiddle('Panel', within(10))).toBe('Panel');
  });

  /** Two names that differ only at the end stay two names. */
  it('keeps the tail, so names that differ at the end stay apart', () => {
    const setembro = truncateMiddle('Monthly report · February', within(18));
    const outubro = truncateMiddle('Monthly report · October', within(18));
    expect(setembro).toBe('Monthly r…February');
    expect(outubro).toBe('Monthly re…October');
    expect(setembro).not.toBe(outubro);
  });

  it('keeps the last word when it is short and six clusters otherwise', () => {
    expect(defaultTail('Monthly report · February')).toBe(8);
    expect(defaultTail('https://aurora.example/reports/2026')).toBe(6);
    expect(defaultTail('Orders ')).toBe(6);
  });

  it('finds the longest head that fits', () => {
    const result = truncateMiddle('abcdefghijklmnopqrstuvwxyz', within(12), { keepTail: 3 });
    expect(result).toBe('abcdefgh…xyz');
    expect(graphemes(result).length).toBe(12);
  });

  it('never splits a grapheme cluster', () => {
    const result = truncateMiddle('👩‍👩‍👧 family 👨‍👩‍👦 reunion', within(9), { keepTail: 3 });
    expect(graphemes(result).every((cluster) => cluster.length > 0)).toBe(true);
    expect(result.endsWith('ion')).toBe(true);
    expect(result.startsWith('👩‍👩‍👧')).toBe(true);
  });

  /** The tail is what tells a name from its neighbour, so it is given up last. */
  it('gives the tail up one cluster at a time when it is what does not fit', () => {
    expect(truncateMiddle('abcdefghij', within(4), { keepTail: 6 })).toBe('…hij');
  });

  it('answers with the ellipsis alone when nothing fits', () => {
    expect(truncateMiddle('abc', () => false)).toBe('…');
  });

  it('trims the space a cut would leave before the ellipsis', () => {
    expect(truncateMiddle('For region north', within(11), { keepTail: 5 })).toBe('For r…north');
    expect(truncateMiddle('For regi north', within(10), { keepTail: 5 })).toBe('For…north');
  });
});
