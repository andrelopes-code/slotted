import { describe, expect, it } from 'vitest';

import { stepFocusIndex, stepPercent, stepReachable, stepStatus } from './steps';

describe('stepStatus', () => {
  it('names the step the reader is on', () => {
    expect(stepStatus({ index: 1, step: 1 })).toBe('current');
  });

  it('leaves a step the reader walked past pending unless it was completed', () => {
    expect(stepStatus({ index: 0, step: 2 })).toBe('pending');
    expect(stepStatus({ index: 0, step: 2, autoComplete: true })).toBe('complete');
  });

  it('takes the consumer word over the position', () => {
    expect(stepStatus({ index: 4, step: 1, complete: true })).toBe('complete');
    expect(stepStatus({ index: 0, step: 2, autoComplete: true, complete: false })).toBe('pending');
  });

  /** Where the reader is outranks what they have finished. */
  it('calls the current step current even once it is complete', () => {
    expect(stepStatus({ index: 2, step: 2, autoComplete: true })).toBe('current');
  });
});

describe('stepReachable', () => {
  const linear = { count: 5, linear: true, step: 2 };

  it('reaches every step of a flow that is not linear', () => {
    expect(stepReachable({ count: 5, index: 4, step: 0 })).toBe(true);
  });

  it('refuses a step the consumer disabled, linear or not', () => {
    expect(stepReachable({ count: 5, index: 4, step: 0, disabled: true })).toBe(false);
    expect(stepReachable({ ...linear, index: 1, disabled: true })).toBe(false);
  });

  it('reaches backwards freely in a linear flow', () => {
    expect(stepReachable({ ...linear, index: 0 })).toBe(true);
    expect(stepReachable({ ...linear, index: 2 })).toBe(true);
  });

  it('refuses a step ahead whose predecessors are unfinished', () => {
    expect(stepReachable({ ...linear, index: 3, isComplete: () => false })).toBe(false);
  });

  it('reaches the next step once everything before it is finished', () => {
    expect(stepReachable({ ...linear, index: 3, isComplete: (i) => i < 3 })).toBe(true);
    expect(stepReachable({ ...linear, index: 4, isComplete: (i) => i < 3 })).toBe(false);
  });

  it('refuses an index outside the flow', () => {
    expect(stepReachable({ count: 5, index: 5, step: 0 })).toBe(false);
    expect(stepReachable({ count: 5, index: -1, step: 0 })).toBe(false);
  });
});

describe('stepPercent', () => {
  /** Distance along the row, which is what the connector between markers is. */
  it('runs from nought on the first step to a hundred on the last', () => {
    expect(stepPercent({ step: 0, count: 5 })).toBe(0);
    expect(stepPercent({ step: 2, count: 5 })).toBe(50);
    expect(stepPercent({ step: 4, count: 5 })).toBe(100);
  });

  it('holds a one-step flow at nought, because it has no connector', () => {
    expect(stepPercent({ step: 0, count: 1 })).toBe(0);
  });

  it('clamps a step outside the flow rather than reporting past a hundred', () => {
    expect(stepPercent({ step: 9, count: 5 })).toBe(100);
    expect(stepPercent({ step: -2, count: 5 })).toBe(0);
  });
});

describe('stepFocusIndex', () => {
  const row = { count: 4, orientation: 'horizontal', direction: 'ltr' } as const;

  it('follows the reading direction along a row', () => {
    expect(stepFocusIndex({ ...row, from: 1, key: 'ArrowRight' })).toBe(2);
    expect(stepFocusIndex({ ...row, from: 1, key: 'ArrowLeft' })).toBe(0);
  });

  it('mirrors the row in a right-to-left document', () => {
    const rtl = { ...row, direction: 'rtl' } as const;
    expect(stepFocusIndex({ ...rtl, from: 1, key: 'ArrowRight' })).toBe(0);
    expect(stepFocusIndex({ ...rtl, from: 1, key: 'ArrowLeft' })).toBe(2);
  });

  /** `dir` does not mirror the block axis, so neither does this. */
  it('never mirrors a column', () => {
    const column = { count: 4, orientation: 'vertical', direction: 'rtl' } as const;
    expect(stepFocusIndex({ ...column, from: 1, key: 'ArrowDown' })).toBe(2);
    expect(stepFocusIndex({ ...column, from: 1, key: 'ArrowUp' })).toBe(0);
  });

  it('leaves an arrow that means nothing in this orientation to the page', () => {
    expect(stepFocusIndex({ ...row, from: 1, key: 'ArrowDown' })).toBe(-1);
    const column = { count: 4, orientation: 'vertical', direction: 'ltr' } as const;
    expect(stepFocusIndex({ ...column, from: 1, key: 'ArrowRight' })).toBe(-1);
  });

  it('wraps at both ends', () => {
    expect(stepFocusIndex({ ...row, from: 3, key: 'ArrowRight' })).toBe(0);
    expect(stepFocusIndex({ ...row, from: 0, key: 'ArrowLeft' })).toBe(3);
  });

  it('steps over a disabled header', () => {
    const isDisabled = (index: number) => index === 2;
    expect(stepFocusIndex({ ...row, from: 1, key: 'ArrowRight', isDisabled })).toBe(3);
  });

  it('takes Home and End to the first and last enabled headers', () => {
    const isDisabled = (index: number) => index === 0 || index === 3;
    expect(stepFocusIndex({ ...row, from: 2, key: 'Home', isDisabled })).toBe(1);
    expect(stepFocusIndex({ ...row, from: 1, key: 'End', isDisabled })).toBe(2);
  });

  it('moves nowhere when every header is disabled', () => {
    expect(stepFocusIndex({ ...row, from: 0, key: 'ArrowRight', isDisabled: () => true })).toBe(-1);
    expect(stepFocusIndex({ ...row, from: 0, key: 'Home', isDisabled: () => true })).toBe(-1);
  });

  it('answers no key it was not given', () => {
    expect(stepFocusIndex({ ...row, from: 0, key: 'Enter' })).toBe(-1);
  });
});
