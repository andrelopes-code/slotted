import { describe, expect, it } from 'vitest';

import { DRAG_KEYS, intentForKey, operationForModifiers } from './keys';

const key = (name: string, extra: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent('keydown', { key: name, ...extra });

describe('intentForKey', () => {
  it('moves along a vertical list with up and down, and across with left and right', () => {
    expect(intentForKey(key('ArrowDown'), 'vertical', 'ltr')).toBe('next');
    expect(intentForKey(key('ArrowUp'), 'vertical', 'ltr')).toBe('previous');
    expect(intentForKey(key('ArrowRight'), 'vertical', 'ltr')).toBe('nextContainer');
    expect(intentForKey(key('ArrowLeft'), 'vertical', 'ltr')).toBe('previousContainer');
  });

  it('follows the writing direction on the inline axis', () => {
    expect(intentForKey(key('ArrowRight'), 'horizontal', 'ltr')).toBe('next');
    expect(intentForKey(key('ArrowRight'), 'horizontal', 'rtl')).toBe('previous');
    expect(intentForKey(key('ArrowLeft'), 'horizontal', 'rtl')).toBe('next');
    expect(intentForKey(key('ArrowRight'), 'vertical', 'rtl')).toBe('previousContainer');
    expect(intentForKey(key('ArrowDown'), 'horizontal', 'ltr')).toBe('nextContainer');
  });

  it('moves a row in a grid with up and down', () => {
    expect(intentForKey(key('ArrowDown'), 'grid', 'ltr')).toBe('rowNext');
    expect(intentForKey(key('ArrowUp'), 'grid', 'ltr')).toBe('rowPrevious');
    expect(intentForKey(key('ArrowLeft'), 'grid', 'rtl')).toBe('next');
  });

  it('reaches the ends, pages, and the other containers', () => {
    expect(intentForKey(key('Home'), 'vertical', 'ltr')).toBe('first');
    expect(intentForKey(key('End'), 'vertical', 'ltr')).toBe('last');
    expect(intentForKey(key('PageDown'), 'vertical', 'ltr')).toBe('pageNext');
    expect(intentForKey(key('PageUp'), 'vertical', 'ltr')).toBe('pagePrevious');
    expect(intentForKey(key('Tab'), 'horizontal', 'rtl')).toBe('nextContainer');
    expect(intentForKey(key('Tab', { shiftKey: true }), 'vertical', 'ltr')).toBe(
      'previousContainer',
    );
  });

  it('is null for the verbs and for any other key', () => {
    expect(intentForKey(key(' '), 'vertical', 'ltr')).toBeNull();
    expect(intentForKey(key('Enter'), 'vertical', 'ltr')).toBeNull();
    expect(intentForKey(key('Escape'), 'vertical', 'ltr')).toBeNull();
    expect(intentForKey(key('a'), 'vertical', 'ltr')).toBeNull();
  });

  it('names the keys for aria-keyshortcuts', () => {
    expect(DRAG_KEYS.drop).toEqual(['Space', 'Enter']);
    expect(DRAG_KEYS.cancel).toEqual(['Escape']);
  });
});

describe('operationForModifiers', () => {
  const all = ['move', 'copy', 'link'] as const;

  it('reads the modifiers the platform reads', () => {
    expect(operationForModifiers({ ctrlKey: true }, all)).toBe('copy');
    expect(operationForModifiers({ altKey: true }, all)).toBe('copy');
    expect(operationForModifiers({ shiftKey: true }, all)).toBe('move');
    expect(operationForModifiers({ ctrlKey: true, shiftKey: true }, all)).toBe('link');
    expect(operationForModifiers({ metaKey: true, altKey: true }, all)).toBe('link');
  });

  it('falls back to the first allowed operation', () => {
    expect(operationForModifiers({}, all)).toBe('move');
    expect(operationForModifiers({ ctrlKey: true }, ['move'])).toBe('move');
    expect(operationForModifiers({}, ['copy', 'move'])).toBe('copy');
  });

  it('is null when nothing is allowed', () => {
    expect(operationForModifiers({}, [])).toBeNull();
  });
});
