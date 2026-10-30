import { describe, expect, it } from 'vitest';

import { parseSeed } from './color';
import { checkScheme, seedGrid } from './recipe-checks';

describe('seedGrid', () => {
  it('spans 24 hues, 8 chromas and 16 lightnesses', () => {
    expect(seedGrid()).toHaveLength(24 * 8 * 16);
  });
});

describe('checkScheme', () => {
  it('names the pair that falls short', () => {
    const grey = parseSeed('#777777')!;
    const values = new Proxy({}, { get: () => grey }) as Record<string, typeof grey>;
    const failures = checkScheme(values, 'light');
    expect(failures).toContain('--slotted-text on --slotted-surface is 1.00:1, below 4.5:1');
  });
});
