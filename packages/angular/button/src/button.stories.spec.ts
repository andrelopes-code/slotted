import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import * as storyModule from './button.stories';

describe('SlButton stories', () => {
  it('matches the required story scenarios', () => {
    const names = Object.keys(storyModule)
      .filter((name) => name !== 'default')
      .map((name) => `${name[0]?.toLowerCase()}${name.slice(1)}`);
    expect(names.sort()).toEqual([...contract.stories].sort());
  });
});
