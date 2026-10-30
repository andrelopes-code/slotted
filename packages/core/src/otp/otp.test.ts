import { describe, expect, it } from 'vitest';

import {
  acceptsCharacter,
  currentSlots,
  normalizeSelection,
  sanitize,
  spreadPlaceholder,
} from './index';

describe('acceptsCharacter', () => {
  it('takes digits for numeric and ASCII letters and digits for alphanumeric', () => {
    expect(acceptsCharacter('7', { type: 'numeric' })).toBe(true);
    expect(acceptsCharacter('a', { type: 'numeric' })).toBe(false);
    expect(acceptsCharacter('a', { type: 'alphanumeric' })).toBe(true);
    expect(acceptsCharacter('Q', { type: 'alphanumeric' })).toBe(true);
    expect(acceptsCharacter('-', { type: 'alphanumeric' })).toBe(false);
    expect(acceptsCharacter('ü', { type: 'alphanumeric' })).toBe(false);
  });

  it('lets a pattern outrank the type', () => {
    expect(acceptsCharacter('a', { type: 'numeric', pattern: /[a-c]/ })).toBe(true);
    expect(acceptsCharacter('7', { type: 'numeric', pattern: /[a-c]/ })).toBe(false);
    /* A global pattern keeps no `lastIndex` between two characters. */
    const global = /[0-3]/g;
    expect(acceptsCharacter('1', { type: 'numeric', pattern: global })).toBe(true);
    expect(acceptsCharacter('1', { type: 'numeric', pattern: global })).toBe(true);
  });
});

describe('sanitize', () => {
  it('drops what is not accepted, cuts to the length and reports the rest', () => {
    expect(sanitize('48-29 15', { length: 6, type: 'numeric' })).toEqual({
      value: '482915',
      rejected: '- ',
    });
    expect(sanitize('12345678', { length: 6, type: 'numeric' })).toEqual({
      value: '123456',
      rejected: '78',
    });
    expect(sanitize('', { length: 6, type: 'numeric' })).toEqual({ value: '', rejected: '' });
  });

  it('runs the consumer transform before the filter', () => {
    expect(
      sanitize('g-x7kq', {
        length: 4,
        type: 'alphanumeric',
        transform: (text) => text.replace(/^g-/i, '').toUpperCase(),
      }),
    ).toEqual({ value: 'X7KQ', rejected: '' });
  });

  it('counts a surrogate pair as one rejected character', () => {
    expect(sanitize('1😀2', { length: 6, type: 'numeric' })).toEqual({
      value: '12',
      rejected: '😀',
    });
  });
});

describe('spreadPlaceholder', () => {
  it('repeats one character, distributes several, and leaves the rest empty', () => {
    expect(spreadPlaceholder('○', 4)).toEqual(['○', '○', '○', '○']);
    expect(spreadPlaceholder('1234', 6)).toEqual(['1', '2', '3', '4', '', '']);
    expect(spreadPlaceholder('', 3)).toEqual(['', '', '']);
    expect(spreadPlaceholder(undefined, 2)).toEqual(['', '']);
  });
});

describe('normalizeSelection', () => {
  const length = 6;

  it('leaves an empty value and a caret at the end of a short value alone', () => {
    expect(normalizeSelection({ start: 0, end: 0, valueLength: 0, length })).toBeNull();
    expect(normalizeSelection({ start: 3, end: 3, valueLength: 3, length })).toBeNull();
  });

  it('selects the character in front of a collapsed caret inside the value', () => {
    expect(normalizeSelection({ start: 0, end: 0, valueLength: 3, length })).toEqual({
      start: 0,
      end: 1,
      direction: 'forward',
    });
    expect(normalizeSelection({ start: 1, end: 1, valueLength: 3, length })).toEqual({
      start: 1,
      end: 2,
      direction: 'forward',
    });
  });

  it('selects the last character when the caret is at the end of a full value', () => {
    expect(normalizeSelection({ start: 6, end: 6, valueLength: 6, length })).toEqual({
      start: 5,
      end: 6,
      direction: 'backward',
    });
  });

  it('moves the selection back one when the caret collapsed backward out of a selection', () => {
    /* ArrowLeft from [2, 3] collapses to 2; the box before it is what moves. */
    expect(
      normalizeSelection({
        start: 2,
        end: 2,
        valueLength: 4,
        length,
        previous: { start: 2, end: 3 },
      }),
    ).toEqual({ start: 1, end: 2, direction: 'backward' });
    /* ArrowRight from [1, 2] collapses to 2; the box at 2 is next. */
    expect(
      normalizeSelection({
        start: 2,
        end: 2,
        valueLength: 4,
        length,
        previous: { start: 1, end: 2 },
      }),
    ).toEqual({ start: 2, end: 3, direction: 'forward' });
    /* Backspace at the caret leaves a collapsed caret that was inserting;
       nothing before it moves. */
    expect(
      normalizeSelection({
        start: 2,
        end: 2,
        valueLength: 4,
        length,
        previous: { start: 3, end: 3 },
      }),
    ).toEqual({ start: 2, end: 3, direction: 'backward' });
  });

  it('keeps a range the reader made', () => {
    expect(normalizeSelection({ start: 1, end: 4, valueLength: 5, length })).toBeNull();
  });
});

describe('currentSlots', () => {
  it('names the box the caret is in, clamped to the last box', () => {
    expect(currentSlots({ start: 3, end: 3, valueLength: 3, length: 6 })).toEqual([3]);
    expect(currentSlots({ start: 6, end: 6, valueLength: 6, length: 6 })).toEqual([5]);
    expect(currentSlots({ start: 0, end: 0, valueLength: 0, length: 6 })).toEqual([0]);
  });

  it('names every box inside a range', () => {
    expect(currentSlots({ start: 1, end: 4, valueLength: 5, length: 6 })).toEqual([1, 2, 3]);
    expect(currentSlots({ start: 0, end: 6, valueLength: 6, length: 6 })).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  it('names nothing without a selection', () => {
    expect(currentSlots(null)).toEqual([]);
  });
});
