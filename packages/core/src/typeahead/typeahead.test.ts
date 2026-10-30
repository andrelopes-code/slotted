import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTypeahead, isPrintable } from './typeahead';

const labels = ['New file', 'New window', 'Open…', 'Save', 'Save as…', 'Settings', 'Ärger'];

describe('createTypeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const typeahead = () => createTypeahead({ now: () => Date.now() });

  it('moves to the next item beginning with the character', () => {
    const handle = typeahead();

    expect(handle.match('o', labels, 0)).toBe(2);
    handle.destroy();
  });

  /** The pattern's own word is "next", so a search starts past where it is. */
  it('starts after the item the reader is on', () => {
    const handle = typeahead();

    expect(handle.match('s', labels, 0)).toBe(3);
    handle.destroy();
  });

  it('refines onto one item as the sequence grows', () => {
    const handle = typeahead();

    expect(handle.match('s', labels, 0)).toBe(3);
    expect(handle.match('a', labels, 3)).toBe(3);
    expect(handle.match('v', labels, 3)).toBe(3);
    expect(handle.query).toBe('sav');
    handle.destroy();
  });

  /**
   * A reader pressing one key repeatedly is asking for the next item beginning
   * with it, not for a longer word. Three presses of `s` walk Save, Save as…
   * and Settings, and the fourth wraps.
   */
  it('cycles through the items beginning with a repeated character', () => {
    const handle = typeahead();

    expect(handle.match('s', labels, 0)).toBe(3);
    expect(handle.match('s', labels, 3)).toBe(4);
    expect(handle.match('s', labels, 4)).toBe(5);
    expect(handle.match('s', labels, 5)).toBe(3);
    handle.destroy();
  });

  it('wraps past the end of the list', () => {
    const handle = typeahead();

    expect(handle.match('n', labels, 5)).toBe(0);
    handle.destroy();
  });

  it('answers -1 when nothing begins with what was typed', () => {
    const handle = typeahead();

    expect(handle.match('z', labels, 0)).toBe(-1);
    handle.destroy();
  });

  it('answers -1 for an empty collection rather than throwing', () => {
    const handle = typeahead();

    expect(handle.match('a', [], 0)).toBe(-1);
    handle.destroy();
  });

  /** `docs/component-features.md` §2.9: typeahead compares by locale. */
  it('matches a letter to its accented form', () => {
    const handle = typeahead();

    expect(handle.match('a', labels, 5)).toBe(6);
    handle.destroy();
  });

  it('is case-blind, because a reader types in lower case', () => {
    const handle = typeahead();

    expect(handle.match('S', labels, 0)).toBe(3);
    handle.destroy();
  });

  it('begins a new sequence once the silence is long enough', () => {
    const handle = typeahead();

    handle.match('s', labels, 0);
    expect(handle.query).toBe('s');

    vi.advanceTimersByTime(600);
    expect(handle.query).toBe('');

    expect(handle.match('o', labels, 0)).toBe(2);
    expect(handle.query).toBe('o');
    handle.destroy();
  });

  it('keeps the sequence while the reader keeps typing', () => {
    const handle = typeahead();

    handle.match('s', labels, 0);
    vi.advanceTimersByTime(300);
    handle.match('e', labels, 3);

    expect(handle.query).toBe('se');
    handle.destroy();
  });

  it('takes a timeout of its own', () => {
    const handle = createTypeahead({ timeout: 100 });

    handle.match('s', labels, 0);
    vi.advanceTimersByTime(150);

    expect(handle.query).toBe('');
    handle.destroy();
  });

  it('ends the sequence when told to, which is what a closing menu does', () => {
    const handle = typeahead();

    handle.match('s', labels, 0);
    handle.reset();

    expect(handle.query).toBe('');
    handle.destroy();
  });

  it('leaves no timer running after it is destroyed', () => {
    const handle = typeahead();

    handle.match('s', labels, 0);
    handle.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('isPrintable', () => {
  it('takes a character and refuses a command key', () => {
    expect(isPrintable('a')).toBe(true);
    expect(isPrintable('7')).toBe(true);
    expect(isPrintable('ß')).toBe(true);
    expect(isPrintable('Enter')).toBe(false);
    expect(isPrintable('ArrowDown')).toBe(false);
  });

  /**
   * Idle, a space is the key that toggles the checkbox item under focus.
   * Mid-sequence it is the space in `New Tab`, and a family that refused it
   * would leave every two-word command unreachable.
   */
  it('reads a space as a command when idle and as a character mid-sequence', () => {
    expect(isPrintable(' ')).toBe(false);
    expect(isPrintable(' ', true)).toBe(true);
  });
});
