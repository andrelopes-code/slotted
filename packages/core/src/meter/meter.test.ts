import { describe, expect, it } from 'vitest';

import { meterRatio, meterRegionTone, meterValueText } from './meter';

describe('meterRatio', () => {
  it('is the share of the range the value covers, held inside it', () => {
    expect(meterRatio({ value: 4380, max: 10000 })).toBe(0.438);
    expect(meterRatio({ value: -5 })).toBe(0);
    expect(meterRatio({ value: 140 })).toBe(1);
    expect(meterRatio({ value: 3, min: 5, max: 5 })).toBe(0);
  });
});

describe('meterRegionTone', () => {
  it('has no tone without regions', () => {
    expect(meterRegionTone({ value: 41 })).toBeUndefined();
  });

  it('reads the regions as the HTML meter element does', () => {
    const disk = { low: 60, high: 85, optimum: 0 };

    expect(meterRegionTone({ value: 40, ...disk })).toBe('success');
    expect(meterRegionTone({ value: 70, ...disk })).toBe('warning');
    expect(meterRegionTone({ value: 95, ...disk })).toBe('danger');
    expect(meterRegionTone({ value: 50, low: 30, high: 70, optimum: 50 })).toBe('success');
    expect(meterRegionTone({ value: 10, low: 30, high: 70, optimum: 50 })).toBe('warning');
  });
});

describe('meterValueText', () => {
  it('says the share in the locale', () => {
    expect(meterValueText({ value: 4380, max: 10000 }, 'en-US')).toBe('43.8%');
    expect(meterValueText({ value: 4380, max: 10000 }, 'pt-BR')).toBe('43,8%');
  });
});
