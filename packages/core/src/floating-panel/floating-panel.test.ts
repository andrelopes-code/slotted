import { describe, expect, it } from 'vitest';

import { clampPlace, cornerPlace, stepPlace } from './index';

const VIEWPORT = { width: 1000, height: 600 };
const PANEL = { width: 300, height: 200 };

describe('the geometry of a floating panel', () => {
  it('keeps the whole panel inside the viewport', () => {
    expect(clampPlace({ x: 900, y: -40 }, PANEL, VIEWPORT)).toEqual({ x: 700, y: 0 });
    expect(clampPlace({ x: 120, y: 80 }, PANEL, VIEWPORT)).toEqual({ x: 120, y: 80 });
    expect(clampPlace({ x: 50, y: 50 }, { width: 1200, height: 700 }, VIEWPORT)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('opens in a corner of the reading direction', () => {
    expect(cornerPlace('bottom-end', PANEL, VIEWPORT, 16)).toEqual({ x: 684, y: 384 });
    expect(cornerPlace('bottom-end', PANEL, VIEWPORT, 16, 'rtl')).toEqual({ x: 16, y: 384 });
    expect(cornerPlace('top-start', PANEL, VIEWPORT, 16)).toEqual({ x: 16, y: 16 });
  });

  it('moves one step on an arrow, a larger one with Shift, and ignores other keys', () => {
    expect(stepPlace({ x: 10, y: 10 }, 'ArrowRight', false)).toEqual({ x: 18, y: 10 });
    expect(stepPlace({ x: 10, y: 40 }, 'ArrowUp', true)).toEqual({ x: 10, y: 8 });
    expect(stepPlace({ x: 10, y: 10 }, 'Enter', false)).toBeNull();
  });
});
