import { describe, expect, it } from 'vitest';

import { applyBounds, boundCss, boundValue, fitBound } from './bound';
import { relativeLuminance } from './color';

const WHITE_TEXT_AA = 1.05 / 4.5 - 0.05;

describe('fitBound', () => {
  const ceiling = fitBound(WHITE_TEXT_AA, 'ceiling', 0.25);

  it('has 27 coefficients', () => {
    expect(ceiling.k).toHaveLength(27);
  });

  it('never lets a color under the ceiling exceed the target luminance', () => {
    for (let h = 0; h < 360; h += 7) {
      for (let c = 0; c <= 0.25; c += 0.025) {
        const l = boundValue(ceiling, c, h);
        const { raw, clipped } = relativeLuminance({ l, c, h });
        expect(Math.max(raw, clipped), `h ${h} c ${c}`).toBeLessThanOrEqual(WHITE_TEXT_AA + 1e-9);
      }
    }
  });

  it('stays within 0.03 of the exact ceiling', () => {
    expect(boundValue(ceiling, 0, 0)).toBeGreaterThan(0.568 - 0.03);
  });

  it('keeps a floor above the target luminance', () => {
    const target = 4.5 * (0.0105 + 0.05) - 0.05;
    const floor = fitBound(target, 'floor', 0.25);
    for (let h = 0; h < 360; h += 11) {
      for (let c = 0; c <= 0.25; c += 0.05) {
        const { raw, clipped } = relativeLuminance({ l: boundValue(floor, c, h), c, h });
        expect(Math.min(raw, clipped)).toBeGreaterThanOrEqual(target - 1e-9);
      }
    }
  });
});

describe('applyBounds', () => {
  it('lowers lightness above a ceiling and leaves it below', () => {
    const bound = { side: 'ceiling' as const, l: 0.5, k: Array(27).fill(0) };
    expect(applyBounds({ l: 0.7, c: 0.1, h: 30 }, [bound]).l).toBe(0.5);
    expect(applyBounds({ l: 0.4, c: 0.1, h: 30 }, [bound]).l).toBe(0.4);
  });
});

/**
 * Evaluates the `calc()` `boundCss` writes, with the channel keywords of an
 * `oklab(from …)` whose alpha carries the chroma: `a = c·cos h`, `b = c·sin h`,
 * `alpha = c`. Only arithmetic, `calc()`, `max()` and the three keywords may
 * appear; anything else leaves an identifier the evaluator rejects.
 */
function evaluateBoundCss(css: string, c: number, h: number): number {
  const radians = (h * Math.PI) / 180;
  const js = css
    .replaceAll('calc(', '(')
    .replaceAll('max(', 'Math.max(')
    .replace(/\balpha\b/g, `(${c})`)
    .replace(/\ba\b/g, `(${c * Math.cos(radians)})`)
    .replace(/\bb\b/g, `(${c * Math.sin(radians)})`);
  expect(js.replaceAll('Math.max', '')).toMatch(/^[\d\s.+\-*/(),e]+$/);
  return Function(`return ${js};`)() as number;
}

/** Functions Firefox 146–152 refuses over a channel keyword (`hypot` crashes 146). */
const REFUSED = /\b(sin|cos|tan|asin|acos|atan|atan2|sqrt|pow|hypot|exp|log)\(/;

describe('boundCss', () => {
  const ceiling = fitBound(WHITE_TEXT_AA, 'ceiling', 0.25);

  it('reads no trigonometric, root, power or logarithm function', () => {
    expect(boundCss(ceiling)).not.toMatch(REFUSED);
  });

  it('computes what boundValue computes, for every hue and chroma', () => {
    for (let h = 0; h < 360; h += 5) {
      for (let c = 0; c <= 0.25 + 1e-9; c += 0.0125) {
        expect(evaluateBoundCss(boundCss(ceiling), c, h), `h ${h} c ${c}`).toBeCloseTo(
          boundValue(ceiling, c, h),
          9,
        );
      }
    }
  });

  it('writes each harmonic as a Chebyshev polynomial in Horner form over a / c and b / c', () => {
    const k = Array(27).fill(0);
    k[0] = 0.1;
    k[3] = -0.2;
    expect(boundCss({ side: 'ceiling', l: 0.5, k })).toBe(
      'calc(0.5 + alpha * (((0.3 + (a / max(alpha, 0.00001)) * (0 + (a / max(alpha, 0.00001)) * (-0.4))) + (b / max(alpha, 0.00001)) * (0)) + alpha * (((0) + (b / max(alpha, 0.00001)) * (0)) + alpha * ((0) + (b / max(alpha, 0.00001)) * (0)))))',
    );
  });
});
