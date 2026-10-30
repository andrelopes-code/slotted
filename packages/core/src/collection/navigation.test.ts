import { describe, expect, it } from 'vitest';

import { moveIndex, PAGE_STEP } from './index';

const all = (count: number) => Array.from({ length: count }, () => true);
const mask = (pattern: string) => [...pattern].map((character) => character === '1');

describe('moveIndex', () => {
  it('reports nothing to highlight for an empty collection', () => {
    expect(moveIndex({ enabled: [], from: -1, intent: 'first' })).toBe(-1);
    expect(moveIndex({ enabled: [], from: -1, intent: 'next' })).toBe(-1);
  });

  it('reports nothing to highlight when every option is disabled', () => {
    expect(moveIndex({ enabled: mask('000'), from: -1, intent: 'first' })).toBe(-1);
    expect(moveIndex({ enabled: mask('000'), from: -1, intent: 'last' })).toBe(-1);
  });

  it('opens onto the first and the last enabled option', () => {
    expect(moveIndex({ enabled: mask('0110'), from: -1, intent: 'first' })).toBe(1);
    expect(moveIndex({ enabled: mask('0110'), from: -1, intent: 'last' })).toBe(2);
  });

  it('steps over a disabled option rather than landing on it', () => {
    expect(moveIndex({ enabled: mask('10011'), from: 0, intent: 'next' })).toBe(3);
    expect(moveIndex({ enabled: mask('11001'), from: 4, intent: 'previous' })).toBe(1);
  });

  it('stops at the end when it does not loop', () => {
    expect(moveIndex({ enabled: all(3), from: 2, intent: 'next' })).toBe(-1);
    expect(moveIndex({ enabled: all(3), from: 0, intent: 'previous' })).toBe(-1);
  });

  it('wraps when it does', () => {
    expect(moveIndex({ enabled: all(3), from: 2, intent: 'next', loop: true })).toBe(0);
    expect(moveIndex({ enabled: all(3), from: 0, intent: 'previous', loop: true })).toBe(2);
  });

  it('wraps past a disabled option at the far end', () => {
    expect(moveIndex({ enabled: mask('0110'), from: 2, intent: 'next', loop: true })).toBe(1);
  });

  /** A `from` a shorter list no longer holds is no highlight, not a crash. */
  it('treats an index the collection no longer holds as no highlight', () => {
    expect(moveIndex({ enabled: all(3), from: 9, intent: 'next' })).toBe(0);
    expect(moveIndex({ enabled: all(3), from: 9, intent: 'previous' })).toBe(2);
  });

  it('travels a page of ten, which is the number the pattern names', () => {
    expect(PAGE_STEP).toBe(10);
    expect(moveIndex({ enabled: all(40), from: 0, intent: 'pageDown' })).toBe(10);
    expect(moveIndex({ enabled: all(40), from: 30, intent: 'pageUp' })).toBe(20);
  });

  it('lands on the end rather than past it', () => {
    expect(moveIndex({ enabled: all(6), from: 0, intent: 'pageDown' })).toBe(5);
    expect(moveIndex({ enabled: all(6), from: 5, intent: 'pageUp' })).toBe(0);
  });

  it('opens a page from either end when there is no highlight yet', () => {
    expect(moveIndex({ enabled: all(40), from: -1, intent: 'pageDown' })).toBe(9);
    expect(moveIndex({ enabled: all(40), from: -1, intent: 'pageUp' })).toBe(30);
  });

  /** A page never wraps, whatever `loop` says: one press, one screen. */
  it('refuses to wrap on a page key even when the collection loops', () => {
    expect(moveIndex({ enabled: all(6), from: 5, intent: 'pageDown', loop: true })).toBe(5);
  });

  it('falls back inward when the option a page lands on is disabled', () => {
    const enabled = mask('1'.repeat(10) + '0' + '1'.repeat(9));
    expect(moveIndex({ enabled, from: 0, intent: 'pageDown' })).toBe(9);
  });

  it('takes a page size a caller states', () => {
    expect(moveIndex({ enabled: all(40), from: 0, intent: 'pageDown', page: 5 })).toBe(5);
  });
});
