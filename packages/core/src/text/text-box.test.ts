import { describe, expect, expectTypeOf, it } from 'vitest';

import { textBoxValues } from './index';
import type { TextBox } from './index';

describe('textBoxValues', () => {
  it('names the trim and leaves the edge to the theme by default', () => {
    expect(textBoxValues(undefined)).toEqual({ trim: null, edge: null });
    expect(textBoxValues('both')).toEqual({ trim: 'trim-both', edge: null });
    expect(textBoxValues({ trim: 'start', edge: 'ex' })).toEqual({
      trim: 'trim-start',
      edge: 'ex text',
    });
    expect(textBoxValues({ trim: 'end', edge: 'ideographic' }).edge).toBe(
      'ideographic ideographic',
    );
    expect(textBoxValues({ trim: 'both', edge: { over: 'cap', under: 'alphabetic' } })).toEqual({
      trim: 'trim-both',
      edge: 'cap alphabetic',
    });
  });

  it('refuses an edge pair the specification rejects, and the CSS keyword', () => {
    expectTypeOf<{
      trim: 'both';
      edge: { over: 'alphabetic'; under: 'cap' };
    }>().not.toMatchTypeOf<TextBox>();
    expectTypeOf<'trim-both'>().not.toMatchTypeOf<TextBox>();
    expectTypeOf<'both'>().toMatchTypeOf<TextBox>();
  });
});
