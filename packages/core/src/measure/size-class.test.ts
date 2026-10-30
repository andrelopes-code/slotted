import { describe, expect, it } from 'vitest';

import { COMPACT_BELOW, EXPANDED_FROM } from './index';

describe('size classes', () => {
  it('names the two widths every page surface composes by', () => {
    expect(COMPACT_BELOW).toBe(600);
    expect(EXPANDED_FROM).toBe(1024);
  });
});
