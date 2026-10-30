import { describe, expect, it } from 'vitest';

import { admitValues, constraintVerdict, joinValues, judgeValue, splitValues } from './index';

const same = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' }) === 0;

const admit = (overrides: Partial<Parameters<typeof admitValues>[0]>) =>
  admitValues({
    values: [],
    candidates: [],
    max: null,
    allowDuplicates: false,
    invalidValues: 'keep',
    normalize: (text) => text.trim(),
    judge: () => ({ valid: true }),
    equals: same,
    ...overrides,
  });

describe('splitValues', () => {
  it('splits on every delimiter and on every line break, and drops empties', () => {
    expect(splitValues('a, b;c\nd\r\ne,,', [',', ';'])).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  /**
   * A column copied out of a spreadsheet arrives one value per line, and a
   * family whose only delimiter is the comma still has to read it.
   */
  it('splits on line breaks whatever the delimiters are', () => {
    expect(splitValues('one\ntwo', [])).toEqual(['one', 'two']);
    expect(splitValues('one two', [])).toEqual(['one two']);
  });

  it('escapes a delimiter that is a regular expression character', () => {
    expect(splitValues('a|b.c', ['|', '.'])).toEqual(['a', 'b', 'c']);
  });
});

describe('joinValues', () => {
  it('writes the shape splitValues reads back', () => {
    const values = ['ana@example.com', 'lee@example.org'];
    const text = joinValues(values, [';']);
    expect(text).toBe('ana@example.com; lee@example.org');
    expect(splitValues(text, [';'])).toEqual(values);
  });
});

describe('constraintVerdict', () => {
  const input = (attributes: Record<string, string>) => {
    const element = document.createElement('input');
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  };

  it('asks the platform about the type, and hands back its own sentence', () => {
    const verdict = constraintVerdict(input({ type: 'email' }), 'jhon@company');
    /* jsdom's email grammar accepts a bare host, the way the platform's does;
       a text with no `@` is what both refuse. */
    expect(constraintVerdict(input({ type: 'email' }), 'jhon.company')).toMatchObject({
      valid: false,
    });
    expect(constraintVerdict(input({ type: 'email' }), 'ana@example.com')).toEqual({ valid: true });
    if (!verdict.valid) expect(typeof verdict.message).toBe('string');
  });

  it('asks the platform about the pattern', () => {
    const sku = input({ pattern: '[A-Z]{3}-\\d{4}' });
    expect(constraintVerdict(sku, 'ABC-1234')).toEqual({ valid: true });
    expect(constraintVerdict(sku, 'abc')).toMatchObject({ valid: false });
  });

  /**
   * A browser flags `tooShort` and `tooLong` only for a value the reader
   * typed, never for one set by script, so the lengths are judged here.
   */
  it('judges the lengths itself, with no sentence of its own', () => {
    expect(constraintVerdict(input({ minlength: '3' }), 'ab')).toEqual({
      valid: false,
      message: '',
    });
    expect(constraintVerdict(input({ maxlength: '3' }), 'abcd')).toEqual({
      valid: false,
      message: '',
    });
    expect(constraintVerdict(input({ maxlength: '3' }), 'abc')).toEqual({ valid: true });
  });

  it('judges everything valid with no input to read', () => {
    expect(constraintVerdict(null, 'anything')).toEqual({ valid: true });
  });
});

describe('judgeValue', () => {
  it('prefers the consumer’s validator, and reads a string as the reason', () => {
    expect(judgeValue('x', () => true, null)).toEqual({ valid: true });
    expect(judgeValue('x', () => false, null)).toEqual({ valid: false, message: '' });
    expect(judgeValue('x', () => 'Not a host', null)).toEqual({
      valid: false,
      message: 'Not a host',
    });
  });
});

describe('admitValues', () => {
  it('normalises, keeps order, and drops what normalises to nothing', () => {
    const result = admit({ candidates: ['  b ', '', 'a'] });
    expect(result.next).toEqual(['b', 'a']);
    expect(result.added).toEqual(['b', 'a']);
  });

  it('refuses a duplicate under the locale-sensitive rule and names the existing value', () => {
    const result = admit({ values: ['Ana'], candidates: ['ana', 'lee'] });
    expect(result.next).toEqual(['Ana', 'lee']);
    expect(result.refused.duplicate).toEqual(['ana']);
    expect(result.existing).toEqual(['Ana']);
  });

  it('takes duplicates when they are allowed', () => {
    expect(admit({ values: ['a'], candidates: ['a'], allowDuplicates: true }).next).toEqual([
      'a',
      'a',
    ]);
  });

  /** A paste past the limit takes what fits, in order, and reports the rest. */
  it('caps at the limit and reports the values that did not fit', () => {
    const result = admit({ values: ['a'], candidates: ['b', 'c', 'd'], max: 2 });
    expect(result.next).toEqual(['a', 'b']);
    expect(result.refused.limit).toEqual(['c', 'd']);
  });

  it('holds an invalid value under keep, and refuses it under refuse', () => {
    const judge = (text: string) =>
      text.includes('@') ? { valid: true as const } : { valid: false as const, message: 'no @' };
    expect(admit({ candidates: ['x', 'a@b'], judge }).next).toEqual(['x', 'a@b']);
    const refused = admit({ candidates: ['x', 'a@b'], judge, invalidValues: 'refuse' });
    expect(refused.next).toEqual(['a@b']);
    expect(refused.refused.invalid).toEqual(['x']);
  });

  /** An edit is not a duplicate of itself, and the edited value keeps its place. */
  it('replaces an edited value in place, without judging it against itself', () => {
    const result = admit({ values: ['a', 'b', 'c'], candidates: ['B'], replacing: 1 });
    expect(result.next).toEqual(['a', 'B', 'c']);
    expect(result.refused.duplicate).toEqual([]);
  });

  it('refuses an edit that becomes another value already held', () => {
    const result = admit({ values: ['a', 'b', 'c'], candidates: ['c'], replacing: 1 });
    expect(result.next).toEqual(['a', 'c']);
    expect(result.refused.duplicate).toEqual(['c']);
  });

  it('places an edit that typed a delimiter as two values where the one was', () => {
    const result = admit({ values: ['a', 'b', 'c'], candidates: ['x', 'y'], replacing: 1 });
    expect(result.next).toEqual(['a', 'x', 'y', 'c']);
  });
});
