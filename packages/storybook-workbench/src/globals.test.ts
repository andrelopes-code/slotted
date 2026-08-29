import { describe, expect, it } from 'vitest';

import { INITIAL_GLOBALS, resolveWorkbenchGlobals } from './globals';

describe('resolveWorkbenchGlobals', () => {
  it('returns safe defaults for an absent Storybook context', () => {
    expect(resolveWorkbenchGlobals(undefined)).toEqual({
      background: '#f4f6f8',
      density: 'comfortable',
      scheme: 'light',
      theme: 'default',
    });
  });

  it('resolves supported dark compact values', () => {
    expect(
      resolveWorkbenchGlobals({ theme: 'default', scheme: 'dark', density: 'compact' }),
    ).toEqual({
      background: '#0e1117',
      density: 'compact',
      scheme: 'dark',
      theme: 'default',
    });
  });

  it('keeps initial globals aligned with the resolver', () => {
    expect(resolveWorkbenchGlobals(INITIAL_GLOBALS)).toMatchObject(INITIAL_GLOBALS);
  });
});
