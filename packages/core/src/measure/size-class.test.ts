import { describe, expect, it } from 'vitest';

import { COMPACT_BELOW, EXPANDED_FROM, sizeClassOf } from './index';

describe('size classes', () => {
  it('names the two widths every page surface composes by', () => {
    expect(COMPACT_BELOW).toBe(600);
    expect(EXPANDED_FROM).toBe(1024);
  });

  it('names the class of a width, the lower width belonging to the larger class', () => {
    expect([0, 599, 600, 1023, 1024, 1440].map(sizeClassOf)).toEqual([
      'compact',
      'compact',
      'medium',
      'medium',
      'expanded',
      'expanded',
    ]);
  });
});
