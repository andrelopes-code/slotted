import { describe, expect, it } from 'vitest';

import { contrast, deltaE, parseSeed, relativeLuminance, toHex } from './color';

describe('parseSeed', () => {
  it('reads six- and three-digit hex in either case', () => {
    expect(toHex(parseSeed('#1D4ED8')!)).toBe('#1d4ed8');
    expect(toHex(parseSeed('#fff')!)).toBe('#ffffff');
  });

  it('reads oklch with a number or a percentage lightness and an optional deg unit', () => {
    const number = parseSeed('oklch(0.5 0.2 264)')!;
    const percent = parseSeed('oklch(50% 0.2 264deg)')!;
    expect(number).toEqual({ l: 0.5, c: 0.2, h: 264 });
    expect(percent).toEqual(number);
  });

  it('refuses anything else', () => {
    for (const text of [
      'red',
      'rgb(0 0 0)',
      '#12345',
      'oklch(1.2 0.1 0)',
      'oklch(0.5 -0.1 0)',
      '',
    ]) {
      expect(parseSeed(text), text).toBeNull();
    }
  });
});

describe('contrast', () => {
  it('is 21 between black and white', () => {
    expect(contrast(parseSeed('#000')!, parseSeed('#fff')!)).toBeCloseTo(21, 5);
  });

  it('matches the WCAG ratio of an sRGB pair', () => {
    expect(contrast(parseSeed('#1d4ed8')!, parseSeed('#ffffff')!)).toBeCloseTo(6.7, 1);
  });

  it('takes the lower of the clipped and unclipped ratios for a color outside sRGB', () => {
    const outside = { l: 0.6, c: 0.35, h: 150 };
    const { raw, clipped } = relativeLuminance(outside);
    expect(raw).not.toBeCloseTo(clipped, 3);
    const white = parseSeed('#fff')!;
    const ratio = (y: number) => 1.05 / (y + 0.05);
    expect(contrast(outside, white)).toBeCloseTo(
      Math.min(ratio(Math.max(0, raw)), ratio(clipped)),
      6,
    );
  });
});

describe('deltaE', () => {
  it('is zero for one color and positive for two', () => {
    const blue = parseSeed('#1d4ed8')!;
    expect(deltaE(blue, blue)).toBe(0);
    expect(deltaE(blue, parseSeed('#2563eb')!)).toBeGreaterThan(0.05);
  });
});
