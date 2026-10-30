import { describe, expect, it } from 'vitest';

import {
  contrastLevel,
  contrastRatio,
  formatColor,
  hsvaToRgba,
  parseColor,
  rgbaToHsva,
} from './color';

const rgba = (input: string) => parseColor(input)!.rgba;

describe('parseColor', () => {
  it('reads every hex length', () => {
    expect(rgba('#2563EB')).toEqual({ r: 37, g: 99, b: 235, a: 1 });
    expect(rgba('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(rgba('#2563EB80').a).toBeCloseTo(0.502, 3);
    expect(rgba('#0008').a).toBeCloseTo(0.533, 3);
    expect(parseColor('#2563EB')!.format).toBe('hex');
  });

  it('reads rgb and hsl in both syntaxes, with alpha', () => {
    expect(rgba('rgb(22 163 74 / 60%)')).toEqual({ r: 22, g: 163, b: 74, a: 0.6 });
    expect(rgba('rgba(22, 163, 74, 0.6)')).toEqual({ r: 22, g: 163, b: 74, a: 0.6 });
    const blue = rgba('hsl(221 83% 53%)');
    /* hsl(221 83% 53%) is the hex rounded to whole percents: a step off. */
    expect(Math.abs(blue.r - 37)).toBeLessThan(1.5);
    expect(Math.abs(blue.b - 235)).toBeLessThan(1.5);
    expect(parseColor('hsla(221, 83%, 53%, .5)')!.rgba.a).toBe(0.5);
  });

  it('reads oklch and reports a color outside sRGB instead of clipping it', () => {
    const inside = parseColor('oklch(0.62 0.19 260)')!;
    expect(inside.format).toBe('oklch');
    expect(inside.inGamut).toBe(true);
    const outside = parseColor('oklch(0.9 0.3 150)')!;
    expect(outside.inGamut).toBe(false);
  });

  it('refuses half a value, a name and a typo', () => {
    expect(parseColor('#25')).toBeNull();
    expect(parseColor('rgb(1 2)')).toBeNull();
    expect(parseColor('blue')).toBeNull();
    expect(parseColor('hsl(x 1% 2%)')).toBeNull();
  });
});

describe('formatColor', () => {
  const blue = { r: 37, g: 99, b: 235, a: 1 };

  it('writes each notation in the space syntax', () => {
    expect(formatColor(blue, 'hex')).toBe('#2563EB');
    expect(formatColor(blue, 'rgb')).toBe('rgb(37 99 235)');
    expect(formatColor(blue, 'hsl')).toBe('hsl(221 83% 53%)');
    expect(formatColor(blue, 'oklch')).toMatch(/^oklch\(0\.5\d+ 0\.2\d+ 26\d\)$/);
  });

  it('writes alpha only when the color has some', () => {
    expect(formatColor({ ...blue, a: 0.6 }, 'hex')).toBe('#2563EB99');
    expect(formatColor({ ...blue, a: 0.6 }, 'rgb')).toBe('rgb(37 99 235 / 60%)');
  });

  it('round-trips through its own output', () => {
    for (const format of ['hex', 'rgb', 'hsl', 'oklch'] as const) {
      const again = rgba(formatColor(blue, format));
      expect(Math.round(again.r)).toBeCloseTo(37, -1);
      expect(Math.round(again.b)).toBeCloseTo(235, -1);
    }
  });
});

describe('HSV', () => {
  it('converts both ways', () => {
    const hsva = rgbaToHsva({ r: 37, g: 99, b: 235, a: 1 });
    expect(Math.round(hsva.h)).toBe(221);
    expect(hsva.s).toBeCloseTo(0.843, 2);
    expect(hsva.v).toBeCloseTo(0.922, 2);
    const back = hsvaToRgba(hsva);
    expect(Math.round(back.r)).toBe(37);
    expect(Math.round(back.g)).toBe(99);
    expect(Math.round(back.b)).toBe(235);
  });
});

describe('contrast', () => {
  it('measures the WCAG ratio and names its level', () => {
    const white = { r: 255, g: 255, b: 255, a: 1 };
    expect(contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, white)).toBeCloseTo(21, 5);
    const blue = contrastRatio({ r: 37, g: 99, b: 235, a: 1 }, white);
    expect(blue).toBeCloseTo(5.17, 2);
    expect(contrastLevel(blue)).toBe('AA');
    expect(contrastLevel(3.3)).toBe('AA-large');
    expect(contrastLevel(2)).toBe('fail');
    expect(contrastLevel(7.2)).toBe('AAA');
  });

  it('composites an alpha color over the background before measuring', () => {
    const white = { r: 255, g: 255, b: 255, a: 1 };
    expect(contrastRatio({ r: 0, g: 0, b: 0, a: 0 }, white)).toBeCloseTo(1, 5);
  });
});
