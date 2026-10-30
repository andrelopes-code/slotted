import { describe, expect, it } from 'vitest';

import {
  keysToMove,
  moveKeys,
  partitionKeys,
  reorderKeys,
  reorderKeysTo,
  toggleVisibleSelection,
} from './index';

const all = ['a', 'b', 'c', 'd', 'e'];

describe('partitionKeys', () => {
  it('draws the target in the order of the collection when it cannot be reordered', () => {
    expect(partitionKeys(all, ['d', 'b'], false)).toEqual({
      source: ['a', 'c', 'e'],
      target: ['b', 'd'],
    });
  });

  it('draws the target in the order of the keys when it can be reordered', () => {
    expect(partitionKeys(all, ['d', 'b'], true).target).toEqual(['d', 'b']);
  });

  /**
   * A key the collection does not hold is a value the form still carries, so
   * it is drawn at the end of the target rather than dropped.
   */
  it('keeps a key the collection does not hold, at the end of the target', () => {
    expect(partitionKeys(all, ['zz', 'b'], false).target).toEqual(['b', 'zz']);
    expect(partitionKeys(all, ['zz', 'b'], true).target).toEqual(['zz', 'b']);
  });

  it('reads a repeated key once', () => {
    expect(partitionKeys(all, ['b', 'b'], true).target).toEqual(['b']);
  });
});

describe('moveKeys', () => {
  it('adds in the order of the collection when the target cannot be reordered', () => {
    expect(
      moveKeys({
        allKeys: all,
        targetKeys: ['d'],
        keys: ['e', 'a'],
        to: 'target',
        reorderable: false,
      }),
    ).toEqual(['a', 'd', 'e']);
  });

  it('appends at the end, in the order of the collection, when the target can be reordered', () => {
    expect(
      moveKeys({
        allKeys: all,
        targetKeys: ['d'],
        keys: ['e', 'a'],
        to: 'target',
        reorderable: true,
      }),
    ).toEqual(['d', 'a', 'e']);
  });

  it('inserts at the drop position when one is given', () => {
    expect(
      moveKeys({
        allKeys: all,
        targetKeys: ['d', 'b'],
        keys: ['a'],
        to: 'target',
        reorderable: true,
        index: 1,
      }),
    ).toEqual(['d', 'a', 'b']);
  });

  it('removes from the target when the keys go back to the source', () => {
    expect(
      moveKeys({
        allKeys: all,
        targetKeys: ['d', 'b', 'a'],
        keys: ['b'],
        to: 'source',
        reorderable: true,
      }),
    ).toEqual(['d', 'a']);
  });

  it('ignores a key already on the side it is sent to', () => {
    expect(
      moveKeys({ allKeys: all, targetKeys: ['d'], keys: ['d'], to: 'target', reorderable: true }),
    ).toEqual(['d']);
  });
});

describe('reorderKeys', () => {
  it('moves a selection one place toward the start, keeping its own order', () => {
    expect(reorderKeys(['a', 'b', 'c', 'd'], ['c', 'd'], -1)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('moves a selection one place toward the end', () => {
    expect(reorderKeys(['a', 'b', 'c', 'd'], ['a', 'b'], 1)).toEqual(['c', 'a', 'b', 'd']);
  });

  /**
   * A block already against the edge stays, and a key selected apart from it
   * still moves: the APG example moves each option it can.
   */
  it('leaves what is against the edge and moves the rest', () => {
    expect(reorderKeys(['a', 'b', 'c', 'd'], ['a', 'c'], -1)).toEqual(['a', 'c', 'b', 'd']);
    expect(reorderKeys(['a', 'b'], ['a'], -1)).toEqual(['a', 'b']);
  });
});

describe('reorderKeysTo', () => {
  it('puts the keys before the key that stood at the index', () => {
    expect(reorderKeysTo(['a', 'b', 'c', 'd'], ['d'], 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('puts them at the end for the index past the last', () => {
    expect(reorderKeysTo(['a', 'b', 'c', 'd'], ['a', 'b'], 4)).toEqual(['c', 'd', 'a', 'b']);
  });
});

describe('keysToMove', () => {
  const disabled = new Set(['c']);

  it('takes the selected keys the pane shows and can move, in the pane order', () => {
    expect(
      keysToMove({
        visible: ['a', 'b', 'c', 'd'],
        selected: ['d', 'c', 'a', 'x'],
        disabled,
        active: 'b',
      }),
    ).toEqual(['a', 'd']);
  });

  it('falls back to the active option when nothing movable is selected', () => {
    expect(keysToMove({ visible: ['a', 'b'], selected: [], disabled, active: 'b' })).toEqual(['b']);
    expect(keysToMove({ visible: ['a', 'c'], selected: [], disabled, active: 'c' })).toEqual([]);
    expect(keysToMove({ visible: ['a'], selected: [], disabled, active: null })).toEqual([]);
  });
});

describe('toggleVisibleSelection', () => {
  const disabled = new Set(['c']);

  it('selects every visible enabled key and keeps the rest of the selection', () => {
    expect(toggleVisibleSelection(['z'], ['a', 'b', 'c'], disabled, true)).toEqual(['z', 'a', 'b']);
  });

  it('clears only the visible keys', () => {
    expect(toggleVisibleSelection(['z', 'a', 'b'], ['a', 'b', 'c'], disabled, false)).toEqual([
      'z',
    ]);
  });
});
