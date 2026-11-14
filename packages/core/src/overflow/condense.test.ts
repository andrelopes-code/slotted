import { describe, expect, it } from 'vitest';

import { condenseState } from './condense';

describe('condenseState', () => {
  it('keeps the row while no label is cut', () => {
    expect(condenseState({ count: 4, needed: 0, overflow: 0, stacked: false, width: 800 })).toEqual(
      { stacked: false, needed: 0 },
    );
  });

  it('stacks a row whose labels are cut, and keeps the width they need', () => {
    expect(
      condenseState({ count: 4, needed: 0, overflow: 30, stacked: false, width: 240 }),
    ).toEqual({ stacked: true, needed: 360 });
  });

  it('stays a column below the width the labels need', () => {
    expect(
      condenseState({ count: 4, needed: 360, overflow: 0, stacked: true, width: 359 }),
    ).toEqual({ stacked: true, needed: 360 });
  });

  it('returns to a row once it has that width', () => {
    expect(
      condenseState({ count: 4, needed: 360, overflow: 0, stacked: true, width: 360 }),
    ).toEqual({ stacked: false, needed: 360 });
  });

  it('asks for more after a return that cut a label again', () => {
    expect(
      condenseState({ count: 4, needed: 360, overflow: 5, stacked: false, width: 360 }),
    ).toEqual({ stacked: true, needed: 380 });
  });
});
