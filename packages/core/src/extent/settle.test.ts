import { describe, expect, it } from 'vitest';

import { settleExtent, SHEET_FLING_PX_PER_S, sheetStops } from './index';

describe('settleExtent', () => {
  const span = 800;

  it('closes a slow release nearer to closed than to the lowest stop', () => {
    expect(settleExtent({ fraction: 0.1, velocity: 0, span, stops: [0.3] })).toBe('close');
    expect(settleExtent({ fraction: 0.2, velocity: 0, span, stops: [0.3] })).toBe(0.3);
  });

  it('goes to the next stop in the direction of a fling, whatever the distance', () => {
    const fast = (SHEET_FLING_PX_PER_S + 1) / span;
    expect(settleExtent({ fraction: 0.52, velocity: fast, span, stops: [0.5, 0.9] })).toBe(0.9);
    expect(settleExtent({ fraction: 0.48, velocity: -fast, span, stops: [0.5, 0.9] })).toBe(
      'close',
    );
    expect(settleExtent({ fraction: 0.95, velocity: fast, span, stops: [0.5, 0.9] })).toBe(0.9);
  });

  it('settles a slow release on the stop nearest where it was heading', () => {
    expect(settleExtent({ fraction: 0.66, velocity: 0.4, span, stops: [0.5, 0.9] })).toBe(0.9);
    expect(settleExtent({ fraction: 0.66, velocity: 0, span, stops: [0.5, 0.9] })).toBe(0.5);
  });

  it('never closes a sheet that is not dismissible', () => {
    expect(
      settleExtent({ dismissible: false, fraction: 0.05, velocity: -2, span, stops: [0.3] }),
    ).toBe(0.3);
  });
});

describe('sheetStops', () => {
  it('adds the content rest to the snap points only when it is a stop', () => {
    expect(sheetStops({ rest: 0.3, restIsStop: true, snapPoints: [0.9] })).toEqual([0.3, 0.9]);
    expect(sheetStops({ rest: 0.3, restIsStop: false, snapPoints: [0.9] })).toEqual([0.9]);
  });

  it('makes the rest the only stop when there are no snap points', () => {
    expect(sheetStops({ rest: 0.4, restIsStop: false, snapPoints: [] })).toEqual([0.4]);
  });
});
