import { describe, expect, it } from 'vitest';

import { defaultOperator, FILTER_KINDS, operandCount, operatorsFor } from './operators';

describe('operatorsFor', () => {
  it('gives text the eight operators the field ships', () => {
    expect(operatorsFor('text')).toEqual([
      'contains',
      'notContains',
      'equals',
      'notEquals',
      'startsWith',
      'endsWith',
      'empty',
      'notEmpty',
    ]);
  });

  it('gives number the six comparisons, the range and the two blanks', () => {
    expect(operatorsFor('number')).toEqual([
      'equals',
      'notEquals',
      'greaterThan',
      'greaterThanOrEqual',
      'lessThan',
      'lessThanOrEqual',
      'between',
      'empty',
      'notEmpty',
    ]);
  });

  it('says is rather than equals for a day and for a boolean', () => {
    expect(operatorsFor('date')).toEqual([
      'is',
      'isNot',
      'before',
      'after',
      'between',
      'empty',
      'notEmpty',
    ]);
    expect(operatorsFor('boolean')).toEqual(['is', 'empty', 'notEmpty']);
  });

  it('gives a time and a date-time the operators of a day, because the sentence is the same', () => {
    expect(operatorsFor('time')).toEqual(operatorsFor('date'));
    expect(operatorsFor('datetime')).toEqual(operatorsFor('date'));
    expect(FILTER_KINDS).toEqual(['text', 'number', 'date', 'time', 'datetime', 'boolean', 'set']);
  });

  it('gives a set the two directions and no more', () => {
    expect(operatorsFor('set')).toEqual(['anyOf', 'noneOf']);
  });

  it('returns a list nobody can write into', () => {
    const operators = operatorsFor('text') as string[];
    expect(() => operators.push('somethingElse')).toThrow();
  });
});

describe('defaultOperator', () => {
  it('takes the field default for each kind', () => {
    expect(defaultOperator('text')).toBe('contains');
    expect(defaultOperator('number')).toBe('equals');
    expect(defaultOperator('date')).toBe('is');
    expect(defaultOperator('time')).toBe('is');
    expect(defaultOperator('datetime')).toBe('is');
    expect(defaultOperator('boolean')).toBe('is');
    expect(defaultOperator('set')).toBe('anyOf');
  });

  it('names an operator that kind actually offers', () => {
    for (const kind of FILTER_KINDS) {
      expect(operatorsFor(kind)).toContain(defaultOperator(kind));
    }
  });
});

describe('operandCount', () => {
  it('gives the two blanks no operand at all', () => {
    expect(operandCount('empty')).toBe(0);
    expect(operandCount('notEmpty')).toBe(0);
  });

  it('gives between two, and it is the only operator that takes two', () => {
    expect(operandCount('between')).toBe(2);
    const twos = FILTER_KINDS.flatMap((kind) => operatorsFor(kind)).filter(
      (operator) => operandCount(operator) === 2,
    );
    expect([...new Set(twos)]).toEqual(['between']);
  });

  it('gives every other operator one, the set list included', () => {
    expect(operandCount('contains')).toBe(1);
    expect(operandCount('greaterThanOrEqual')).toBe(1);
    expect(operandCount('is')).toBe(1);
    expect(operandCount('anyOf')).toBe(1);
  });
});
