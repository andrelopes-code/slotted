import { describe, expect, it } from 'vitest';

import {
  activeConditions,
  emptyFilter,
  isConditionActive,
  isFilterActive,
  normalizeFilter,
  setFilter,
  withCondition,
  withJoin,
} from './descriptor';
import type { NumberFilter, TextFilter } from './descriptor';

describe('emptyFilter', () => {
  it('opens on the kind default, joined by and, with one condition', () => {
    expect(emptyFilter('text')).toEqual({
      kind: 'text',
      join: 'and',
      conditions: [{ operator: 'contains' }],
    });
  });

  it('takes a starting operator when the consumer names one', () => {
    expect(emptyFilter('number', 'between').conditions[0]?.operator).toBe('between');
  });
});

describe('setFilter', () => {
  it('builds the descriptor a chosen list of values is', () => {
    expect(setFilter(['paid', 'refunded'])).toEqual({
      kind: 'set',
      join: 'and',
      conditions: [{ operator: 'anyOf', value: ['paid', 'refunded'] }],
    });
  });

  it('takes the other direction when asked', () => {
    expect(setFilter(['paid'], 'noneOf').conditions[0]?.operator).toBe('noneOf');
  });
});

describe('isConditionActive', () => {
  it('calls a blank operator active with no operand at all', () => {
    expect(isConditionActive('text', { operator: 'empty' })).toBe(true);
    expect(isConditionActive('number', { operator: 'notEmpty' })).toBe(true);
  });

  it('calls a missing operand inactive', () => {
    expect(isConditionActive('text', { operator: 'contains' })).toBe(false);
    expect(isConditionActive('text', { operator: 'contains', value: '' })).toBe(false);
    expect(isConditionActive('text', { operator: 'contains', value: null })).toBe(false);
  });

  it('calls a range with one end inactive', () => {
    expect(isConditionActive('number', { operator: 'between', value: 10 })).toBe(false);
    expect(isConditionActive('number', { operator: 'between', value: 10, end: 20 })).toBe(true);
  });

  it('reads a number that is not a number as missing', () => {
    expect(isConditionActive('number', { operator: 'equals', value: Number.NaN })).toBe(false);
    expect(isConditionActive('number', { operator: 'equals', value: 0 })).toBe(true);
  });

  it('reads false as an operand, because false is what the reader chose', () => {
    expect(isConditionActive('boolean', { operator: 'is', value: false })).toBe(true);
  });

  it('reads an empty list as a missing operand', () => {
    expect(isConditionActive('set', { operator: 'anyOf', value: [] })).toBe(false);
    expect(isConditionActive('set', { operator: 'anyOf', value: ['paid'] })).toBe(true);
  });
});

describe('activeConditions', () => {
  it('drops the inactive ones, under and as under or', () => {
    const filter: TextFilter = {
      kind: 'text',
      join: 'or',
      conditions: [{ operator: 'contains', value: 'ana' }, { operator: 'startsWith' }],
    };
    expect(activeConditions(filter)).toEqual([{ operator: 'contains', value: 'ana' }]);
  });

  it('gives nothing for a filter that holds nothing', () => {
    expect(activeConditions(emptyFilter('text'))).toEqual([]);
    expect(activeConditions(null)).toEqual([]);
  });
});

describe('isFilterActive', () => {
  it('is false for null, for undefined and for a filter with no active condition', () => {
    expect(isFilterActive(null)).toBe(false);
    expect(isFilterActive(undefined)).toBe(false);
    expect(isFilterActive(emptyFilter('number'))).toBe(false);
  });

  it('is true as soon as one condition is complete', () => {
    expect(isFilterActive({ ...emptyFilter('text'), conditions: [{ operator: 'empty' }] })).toBe(
      true,
    );
  });
});

describe('normalizeFilter', () => {
  it('returns null rather than a descriptor nothing can be read from', () => {
    expect(normalizeFilter(emptyFilter('text'))).toBeNull();
    expect(normalizeFilter(null)).toBeNull();
  });

  it('keeps only what is active, and keeps the join', () => {
    const filter: NumberFilter = {
      kind: 'number',
      join: 'or',
      conditions: [{ operator: 'greaterThan', value: 10 }, { operator: 'lessThan' }],
    };
    expect(normalizeFilter(filter)).toEqual({
      kind: 'number',
      join: 'or',
      conditions: [{ operator: 'greaterThan', value: 10 }],
    });
  });
});

describe('withCondition and withJoin', () => {
  it('replaces one condition and leaves the rest alone', () => {
    const filter = emptyFilter('text');
    const next = withCondition(filter, 0, { operator: 'endsWith', value: 'ana' });
    expect(next.conditions).toEqual([{ operator: 'endsWith', value: 'ana' }]);
    expect(filter.conditions).toEqual([{ operator: 'contains' }]);
  });

  it('appends when the index is past the end, so a second condition is one call', () => {
    const filter = emptyFilter('text');
    const next = withCondition(filter, 1, { operator: 'contains', value: 'b' });
    expect(next.conditions).toHaveLength(2);
  });

  it('changes the join without touching the conditions', () => {
    const filter = withJoin(emptyFilter('text'), 'or');
    expect(filter.join).toBe('or');
    expect(filter.conditions).toEqual([{ operator: 'contains' }]);
  });
});
