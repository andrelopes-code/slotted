import { describe, expect, it } from 'vitest';

import {
  isHeldOpen,
  isOpenValue,
  nextOpenValues,
  openValuesDelta,
  sameOpenValues,
} from './disclosure';

describe('nextOpenValues', () => {
  it('opens one and closes the rest while only one may be open', () => {
    expect(nextOpenValues(['a'], 'b')).toEqual(['b']);
  });

  it('adds to the set while several may be open', () => {
    expect(nextOpenValues(['a'], 'b', { multiple: true })).toEqual(['a', 'b']);
  });

  it('closes an open value', () => {
    expect(nextOpenValues(['a', 'b'], 'a', { multiple: true })).toEqual(['b']);
  });

  it('empties the set when the last open value is closed', () => {
    expect(nextOpenValues(['a'], 'a')).toEqual([]);
  });

  /** The APG's "some implementations require one panel to be expanded at all times". */
  it('refuses to close the last open value when the set may not empty', () => {
    const current = ['a'];
    expect(nextOpenValues(current, 'a', { requireOpen: true })).toBe(current);
  });

  it('still closes one of several when the set may not empty', () => {
    expect(nextOpenValues(['a', 'b'], 'a', { multiple: true, requireOpen: true })).toEqual(['b']);
  });

  it('still opens a closed value when the set may not empty', () => {
    expect(nextOpenValues(['a'], 'b', { requireOpen: true })).toEqual(['b']);
  });
});

describe('isHeldOpen', () => {
  it('is true only for the one open value that may not close', () => {
    expect(isHeldOpen(['a'], 'a', { requireOpen: true })).toBe(true);
    expect(isHeldOpen(['a', 'b'], 'a', { multiple: true, requireOpen: true })).toBe(false);
    expect(isHeldOpen(['a'], 'b', { requireOpen: true })).toBe(false);
    expect(isHeldOpen(['a'], 'a')).toBe(false);
  });
});

describe('isOpenValue', () => {
  it('answers membership', () => {
    expect(isOpenValue(['a', 'b'], 'b')).toBe(true);
    expect(isOpenValue([], 'b')).toBe(false);
  });
});

describe('openValuesDelta', () => {
  it('names what opened and what closed', () => {
    expect(openValuesDelta(['a'], ['b'])).toEqual({ opened: ['b'], closed: ['a'] });
    expect(openValuesDelta(['a'], ['a', 'b'])).toEqual({ opened: ['b'], closed: [] });
  });
});

describe('sameOpenValues', () => {
  it('compares two sets by their members rather than by identity', () => {
    expect(sameOpenValues(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameOpenValues(['a'], ['a', 'b'])).toBe(false);
    expect(sameOpenValues([], [])).toBe(true);
  });
});
