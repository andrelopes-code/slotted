import { describe, expect, it } from 'vitest';

import { treeBranches } from './index';

describe('treeBranches', () => {
  it('ends the rail of a parent at its last child and starts the next at the next parent', () => {
    expect(treeBranches([0, 1, 1, 0, 1])).toEqual([
      { last: false, open: true, rails: [] },
      { last: false, open: false, rails: [] },
      { last: true, open: false, rails: [] },
      { last: true, open: true, rails: [] },
      { last: true, open: false, rails: [] },
    ]);
  });

  it('carries the rail of an ancestor past the children of a child that is not the last', () => {
    expect(treeBranches([0, 1, 2, 2, 1])).toEqual([
      { last: true, open: true, rails: [] },
      { last: false, open: true, rails: [] },
      { last: false, open: false, rails: [0] },
      { last: true, open: false, rails: [0] },
      { last: true, open: false, rails: [] },
    ]);
  });

  it('carries no rail of an ancestor past its last child', () => {
    expect(treeBranches([0, 1, 2, 3, 0]).map((branch) => branch.rails)).toEqual([
      [],
      [],
      [],
      [],
      [],
    ]);
  });
});
