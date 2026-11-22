import { describe, expect, it } from 'vitest';

import { toRgb } from './color';

describe('toRgb', () => {
  it('returns an rgb() or rgba() color as it came', () => {
    expect(toRgb('rgb(1, 2, 3)', document)).toBe('rgb(1, 2, 3)');
    expect(toRgb('rgba(1, 2, 3, 0.5)', document)).toBe('rgba(1, 2, 3, 0.5)');
  });

  it('returns a keyword it cannot convert as it came', () => {
    expect(toRgb('CanvasText', document)).toBe('CanvasText');
  });

  it('returns any color as it came where no document draws it', () => {
    expect(toRgb('oklch(0.66 0.16 215)', undefined)).toBe('oklch(0.66 0.16 215)');
  });
});
