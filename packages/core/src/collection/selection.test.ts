import { describe, expect, it } from 'vitest';

import { nextSelection } from './selection';
import type { SelectionRequest } from './selection';

const keys = ['a', 'b', 'c', 'd', 'e'];

const request = (overrides: Partial<SelectionRequest> & Pick<SelectionRequest, 'action'>) =>
  nextSelection({
    mode: 'multiple',
    selected: [],
    keys,
    ...overrides,
  } as SelectionRequest);

describe('nextSelection, mode none', () => {
  it('never moves', () => {
    const result = request({ mode: 'none', action: 'toggle', key: 'a' });
    expect(result.changed).toBe(false);
    expect(result.selected).toEqual([]);
  });
});

describe('nextSelection, single', () => {
  it('replaces whatever was chosen', () => {
    const result = request({ mode: 'single', selected: ['a'], action: 'toggle', key: 'c' });
    expect(result.selected).toEqual(['c']);
    expect(result.anchor).toBe('c');
    expect(result.changed).toBe(true);
  });

  it('lets the reader unchoose by pressing the chosen option again', () => {
    const result = request({ mode: 'single', selected: ['c'], action: 'toggle', key: 'c' });
    expect(result.selected).toEqual([]);
    expect(result.changed).toBe(true);
  });

  /** A required control cannot be emptied by pressing its own answer twice. */
  it('refuses to empty itself when the consumer says it may not', () => {
    const result = request({
      mode: 'single',
      selected: ['c'],
      action: 'toggle',
      key: 'c',
      disallowEmpty: true,
    });
    expect(result.selected).toEqual(['c']);
    expect(result.changed).toBe(false);
  });

  it('collapses a range to the one option, because single means one', () => {
    const result = request({
      mode: 'single',
      selected: ['a'],
      anchor: 'a',
      action: 'range',
      key: 'd',
    });
    expect(result.selected).toEqual(['d']);
  });
});

describe('nextSelection, multiple with the toggle behavior', () => {
  it('adds and removes one option at a time, with no modifier held', () => {
    const added = request({ selected: ['a'], action: 'toggle', key: 'c' });
    expect(added.selected).toEqual(['a', 'c']);
    const removed = request({ selected: ['a', 'c'], action: 'toggle', key: 'a' });
    expect(removed.selected).toEqual(['c']);
  });

  /** Two identical selections have to compare equal, whatever order they were picked in. */
  it('returns the collection order rather than the order the reader picked', () => {
    const result = request({ selected: ['e', 'b'], action: 'toggle', key: 'a' });
    expect(result.selected).toEqual(['a', 'b', 'e']);
  });

  it('refuses to empty itself when the consumer says it may not', () => {
    const result = request({
      selected: ['c'],
      action: 'toggle',
      key: 'c',
      disallowEmpty: true,
    });
    expect(result.changed).toBe(false);
  });

  it('never selects a disabled option', () => {
    const result = request({
      action: 'toggle',
      key: 'c',
      disabled: (key) => key === 'c',
    });
    expect(result.changed).toBe(false);
  });
});

describe('nextSelection, multiple with the replace behavior', () => {
  it('makes a plain press the whole selection', () => {
    const result = request({
      behavior: 'replace',
      selected: ['a', 'b'],
      action: 'toggle',
      key: 'd',
    });
    expect(result.selected).toEqual(['d']);
  });

  it('lets the last remaining option be pressed away', () => {
    const result = request({
      behavior: 'replace',
      selected: ['d'],
      action: 'toggle',
      key: 'd',
    });
    expect(result.selected).toEqual([]);
  });

  it('replaces the selection with a range rather than adding to it', () => {
    const result = request({
      behavior: 'replace',
      selected: ['e'],
      anchor: 'b',
      action: 'range',
      key: 'd',
    });
    expect(result.selected).toEqual(['b', 'c', 'd']);
  });
});

describe('nextSelection, ranges', () => {
  it('selects from the anchor to the option, inclusive, in either direction', () => {
    const down = request({ selected: [], anchor: 'b', action: 'range', key: 'd' });
    expect(down.selected).toEqual(['b', 'c', 'd']);
    const up = request({ selected: [], anchor: 'd', action: 'range', key: 'b' });
    expect(up.selected).toEqual(['b', 'c', 'd']);
  });

  it('adds the range to what the reader already had, under the toggle behavior', () => {
    const result = request({ selected: ['a'], anchor: 'c', action: 'range', key: 'd' });
    expect(result.selected).toEqual(['a', 'c', 'd']);
  });

  /**
   * A range is measured from where it started. Moving the anchor would make
   * Shift held down across four presses grow four selections instead of one.
   */
  it('leaves the anchor where it was', () => {
    const result = request({ selected: [], anchor: 'b', action: 'range', key: 'd' });
    expect(result.anchor).toBe('b');
  });

  it('starts a range at the option itself when nothing anchored it', () => {
    const result = request({ selected: [], action: 'range', key: 'c' });
    expect(result.selected).toEqual(['c']);
  });

  it('steps over a disabled option inside the range', () => {
    const result = request({
      selected: [],
      anchor: 'b',
      action: 'range',
      key: 'd',
      disabled: (key) => key === 'c',
    });
    expect(result.selected).toEqual(['b', 'd']);
  });

  it('refuses a range anchored on a key the collection no longer holds', () => {
    const result = request({ selected: [], anchor: 'z', action: 'range', key: 'c' });
    expect(result.changed).toBe(false);
  });
});

describe('nextSelection, select all', () => {
  it('selects every enabled option', () => {
    const result = request({ action: 'all', disabled: (key) => key === 'c' });
    expect(result.selected).toEqual(['a', 'b', 'd', 'e']);
  });

  /** The pattern's optional second half: pressed again, it clears. */
  it('clears when everything selectable is already selected', () => {
    const result = request({
      selected: ['a', 'b', 'd', 'e'],
      action: 'all',
      disabled: (key) => key === 'c',
    });
    expect(result.selected).toEqual([]);
  });

  it('does nothing in single selection', () => {
    const result = request({ mode: 'single', selected: ['a'], action: 'all' });
    expect(result.changed).toBe(false);
  });

  it('does nothing when the consumer has refused it', () => {
    const result = request({ action: 'all', disallowSelectAll: true });
    expect(result.changed).toBe(false);
  });
});

describe('nextSelection, clearing', () => {
  it('empties the selection', () => {
    const result = request({ selected: ['a', 'c'], action: 'clear' });
    expect(result.selected).toEqual([]);
    expect(result.changed).toBe(true);
  });

  it('refuses when the consumer says the control may not be empty', () => {
    const result = request({ selected: ['a'], action: 'clear', disallowEmpty: true });
    expect(result.changed).toBe(false);
  });

  it('emits nothing when there was nothing to clear', () => {
    expect(request({ selected: [], action: 'clear' }).changed).toBe(false);
  });
});

describe('nextSelection, a key the collection no longer holds', () => {
  /**
   * A filtered list, or a page that has moved on. Deleting the choice silently
   * would delete a choice nobody asked to delete.
   */
  it('keeps it while the reader acts on something else', () => {
    const result = request({ selected: ['z'], action: 'toggle', key: 'b' });
    expect(result.selected).toEqual(['b', 'z']);
  });
});
