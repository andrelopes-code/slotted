import { describe, expect, it } from 'vitest';

import {
  fractionAtPoint,
  fractionOfValue,
  moveThumb,
  nearestThumb,
  normalizeValue,
  normalizeValues,
  sameValues,
  thumbBounds,
  valueAtFraction,
} from './slider';

const horizontal = {
  rect: { x: 100, y: 0, width: 200, height: 8 },
  orientation: 'horizontal' as const,
  rtl: false,
};

describe('fractionAtPoint', () => {
  it('measures along the inline axis from the start edge', () => {
    expect(fractionAtPoint({ x: 200, y: 4 }, horizontal)).toBe(0.5);
  });

  it('mirrors the inline axis in a right-to-left document', () => {
    expect(fractionAtPoint({ x: 150, y: 4 }, { ...horizontal, rtl: true })).toBe(0.75);
  });

  it('measures a vertical track from the bottom, where its minimum is', () => {
    const track = {
      rect: { x: 0, y: 20, width: 8, height: 100 },
      orientation: 'vertical' as const,
      rtl: false,
    };

    expect(fractionAtPoint({ x: 4, y: 120 }, track)).toBe(0);
    expect(fractionAtPoint({ x: 4, y: 20 }, track)).toBe(1);
  });

  it('leaves the block axis alone in a right-to-left document', () => {
    const track = {
      rect: { x: 0, y: 0, width: 8, height: 100 },
      orientation: 'vertical' as const,
      rtl: true,
    };

    expect(fractionAtPoint({ x: 4, y: 25 }, track)).toBe(0.75);
  });

  it('holds a point outside the track at the nearest end', () => {
    expect(fractionAtPoint({ x: -50, y: 4 }, horizontal)).toBe(0);
    expect(fractionAtPoint({ x: 9999, y: 4 }, horizontal)).toBe(1);
  });

  it('answers nought for a track with no length rather than dividing by it', () => {
    expect(
      fractionAtPoint({ x: 5, y: 5 }, { ...horizontal, rect: { x: 0, y: 0, width: 0, height: 0 } }),
    ).toBe(0);
  });
});

describe('valueAtFraction', () => {
  it('snaps to the step grid measured from the minimum', () => {
    expect(valueAtFraction(0.5, { min: 2, max: 20, step: 3 })).toBe(11);
    expect(valueAtFraction(0.2, { min: 2, max: 20, step: 3 })).toBe(5);
  });

  it('keeps a fractional step at the precision the step is written at', () => {
    expect(valueAtFraction(0.333, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  });

  it('treats a step of nought as a continuous scale', () => {
    expect(valueAtFraction(0.5, { min: 0, max: 1, step: 0 })).toBe(0.5);
  });
});

describe('fractionOfValue', () => {
  it('places a value on the track', () => {
    expect(fractionOfValue(25, { min: 0, max: 100 })).toBe(0.25);
  });

  it('answers nought for a scale of no length', () => {
    expect(fractionOfValue(5, { min: 5, max: 5 })).toBe(0);
  });
});

describe('thumbBounds', () => {
  it('gives a lone thumb the whole scale', () => {
    expect(thumbBounds({ values: [40], index: 0, min: 0, max: 100, step: 1 })).toEqual({
      min: 0,
      max: 100,
    });
  });

  it('stops each thumb at its neighbour', () => {
    const scale = { values: [20, 80], min: 0, max: 100, step: 1 };

    expect(thumbBounds({ ...scale, index: 0 })).toEqual({ min: 0, max: 80 });
    expect(thumbBounds({ ...scale, index: 1 })).toEqual({ min: 20, max: 100 });
  });

  it('keeps the requested number of steps between two thumbs', () => {
    const scale = { values: [20, 80], min: 0, max: 100, step: 5, minStepsBetween: 2 };

    expect(thumbBounds({ ...scale, index: 0 })).toEqual({ min: 0, max: 70 });
    expect(thumbBounds({ ...scale, index: 1 })).toEqual({ min: 30, max: 100 });
  });

  it('reads a middle thumb against both of its neighbours', () => {
    expect(thumbBounds({ values: [10, 50, 90], index: 1, min: 0, max: 100, step: 1 })).toEqual({
      min: 10,
      max: 90,
    });
  });
});

describe('nearestThumb', () => {
  it('takes the closer of two thumbs', () => {
    expect(nearestThumb([20, 80], 30)).toBe(0);
    expect(nearestThumb([20, 80], 70)).toBe(1);
  });

  /**
   * Two thumbs on one value is the case a nearest-only rule gets wrong: both
   * are nought away, and always picking the first leaves the upper thumb unable
   * to leave the bottom of the scale.
   */
  it('breaks a tie in the direction the press is pulling', () => {
    expect(nearestThumb([50, 50], 90)).toBe(1);
    expect(nearestThumb([50, 50], 10)).toBe(0);
  });

  it('answers minus one for a slider with no thumbs', () => {
    expect(nearestThumb([], 10)).toBe(-1);
  });
});

describe('moveThumb', () => {
  const scale = { min: 0, max: 100, step: 1 };

  it('moves one thumb and leaves the rest', () => {
    expect(moveThumb({ ...scale, values: [20, 80], index: 0, next: 35 })).toEqual([35, 80]);
  });

  it('refuses to let a thumb pass its neighbour', () => {
    expect(moveThumb({ ...scale, values: [20, 80], index: 0, next: 95 })).toEqual([80, 80]);
  });

  it('holds a thumb inside the scale', () => {
    expect(moveThumb({ ...scale, values: [20], index: 0, next: 400 })).toEqual([100]);
  });

  /** Identity, so a caller never emits a request for the value it already holds. */
  it('returns the same array when nothing moved', () => {
    const values = [20, 80];

    expect(moveThumb({ ...scale, values, index: 0, next: 20 })).toBe(values);
  });

  it('returns the same array for a thumb that does not exist', () => {
    const values = [20];

    expect(moveThumb({ ...scale, values, index: 3, next: 40 })).toBe(values);
  });
});

describe('normalizeValue and normalizeValues', () => {
  it('puts a value on the grid and inside the scale', () => {
    expect(normalizeValue(7, { min: 0, max: 10, step: 5 })).toBe(5);
    expect(normalizeValue(-4, { min: 0, max: 10, step: 5 })).toBe(0);
  });

  it('answers the minimum for a value that is not a number', () => {
    expect(normalizeValue(Number.NaN, { min: 3, max: 10, step: 1 })).toBe(3);
  });

  it('orders a set a consumer handed backwards', () => {
    expect(normalizeValues([80, 20], { min: 0, max: 100, step: 1 })).toEqual([20, 80]);
  });
});

describe('sameValues', () => {
  it('compares by content and by length', () => {
    expect(sameValues([1, 2], [1, 2])).toBe(true);
    expect(sameValues([1, 2], [1, 3])).toBe(false);
    expect(sameValues([1], [1, 2])).toBe(false);
  });
});
