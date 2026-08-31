import { describe, expect, it } from 'vitest';

import { clamp, percentOf, roundTo } from './index';

describe('clamp', () => {
  it('leaves a value inside the range alone', () => {
    expect(clamp(40, 0, 100)).toBe(40);
  });

  it('holds a value at each end rather than rejecting it', () => {
    expect(clamp(140, 0, 100)).toBe(100);
    expect(clamp(-20, 0, 100)).toBe(0);
  });

  it('collapses an inverted range to its minimum', () => {
    expect(clamp(50, 80, 20)).toBe(80);
  });
});

describe('roundTo', () => {
  it('returns a number, so an attribute and a style cannot disagree', () => {
    expect(roundTo(42.857142, 4)).toBe(42.8571);
    expect(typeof roundTo(1 / 3, 2)).toBe('number');
  });

  it('drops trailing zeroes, which a fixed-point string would keep', () => {
    expect(roundTo(50, 2)).toBe(50);
  });
});

describe('percentOf', () => {
  it('measures a value against its range', () => {
    expect(percentOf(3, 0, 7)).toBe(42.8571);
  });

  it('counts from a minimum that is not zero', () => {
    expect(percentOf(15, 10, 20)).toBe(50);
  });

  it('clamps before it measures, so the number and the paint agree', () => {
    expect(percentOf(140, 0, 100)).toBe(100);
    expect(percentOf(-20, 0, 100)).toBe(0);
  });

  it('calls an empty range nought rather than dividing by zero', () => {
    expect(percentOf(5, 10, 10)).toBe(0);
    expect(Number.isFinite(percentOf(5, 10, 10))).toBe(true);
  });

  it('rounds to the places it was asked for', () => {
    expect(percentOf(1, 0, 3, 2)).toBe(33.33);
  });
});
