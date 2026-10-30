import { describe, expect, it } from 'vitest';

import { emptyFilter, setFilter } from './descriptor';
import type { FilterDescriptor } from './descriptor';
import { fromFilterParams, parseFilter, serializeFilter, toFilterParams } from './serialize';

const roundTrip = (filter: FilterDescriptor) => parseFilter(serializeFilter(filter));

describe('serializeFilter', () => {
  it('writes a condition as its operator and its operands', () => {
    expect(
      serializeFilter({
        kind: 'text',
        join: 'and',
        conditions: [{ operator: 'contains', value: 'ana' }],
      }),
    ).toBe('text~and~contains:ana');
  });

  it('writes an operator that takes nothing as itself', () => {
    expect(
      serializeFilter({ kind: 'text', join: 'and', conditions: [{ operator: 'empty' }] }),
    ).toBe('text~and~empty');
  });

  it('writes two conditions and the join between them', () => {
    expect(
      serializeFilter({
        kind: 'number',
        join: 'or',
        conditions: [
          { operator: 'greaterThan', value: 10 },
          { operator: 'lessThan', value: 5 },
        ],
      }),
    ).toBe('number~or~greaterThan:10~lessThan:5');
  });

  it('writes a range as two operands of one condition', () => {
    expect(
      serializeFilter({
        kind: 'date',
        join: 'and',
        conditions: [{ operator: 'between', value: '2026-01-01', end: '2026-03-31' }],
      }),
    ).toBe('date~and~between:2026-01-01:2026-03-31');
  });

  it('writes a chosen list as one operand', () => {
    expect(serializeFilter(setFilter(['paid', 'refunded']))).toBe('set~and~anyOf:paid,refunded');
  });

  it('writes nothing for a filter holding nothing', () => {
    expect(serializeFilter(emptyFilter('text'))).toBe('');
    expect(serializeFilter(null)).toBe('');
  });

  it('escapes every character the format itself uses', () => {
    const filter: FilterDescriptor = {
      kind: 'text',
      join: 'and',
      conditions: [{ operator: 'contains', value: 'a~b:c,d e&f' }],
    };
    const written = serializeFilter(filter);
    expect(written.split('~')).toHaveLength(3);
    expect(roundTrip(filter)).toEqual(filter);
  });
});

describe('parseFilter', () => {
  it('reads back everything it writes', () => {
    const filters: FilterDescriptor[] = [
      { kind: 'text', join: 'and', conditions: [{ operator: 'contains', value: 'ana' }] },
      { kind: 'text', join: 'and', conditions: [{ operator: 'notEmpty' }] },
      {
        kind: 'number',
        join: 'or',
        conditions: [
          { operator: 'between', value: 10, end: 20 },
          { operator: 'equals', value: 0 },
        ],
      },
      { kind: 'date', join: 'and', conditions: [{ operator: 'before', value: '2026-09-10' }] },
      /* The colon the format uses as its operand separator is also the one ISO
         time is written with, and it has to survive both ways. */
      {
        kind: 'time',
        join: 'and',
        conditions: [{ operator: 'between', value: '22:00', end: '02:00' }],
      },
      { kind: 'time', join: 'or', conditions: [{ operator: 'is', value: '09' }] },
      {
        kind: 'datetime',
        join: 'and',
        conditions: [{ operator: 'after', value: '2026-09-14T10:30:15' }],
      },
      { kind: 'datetime', join: 'and', conditions: [{ operator: 'is', value: '2026-09-14' }] },
      { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: false }] },
      setFilter(['paid', 'a,b'], 'noneOf'),
    ];
    for (const filter of filters) expect(roundTrip(filter)).toEqual(filter);
  });

  it('returns null rather than throwing on anything it cannot read', () => {
    for (const text of [
      '',
      'text',
      'text~and',
      'colour~and~is:red',
      'text~maybe~contains:a',
      'text~and~greaterThan:1',
      'text~and~contains',
      'number~and~equals:ten',
      'date~and~is:10/09/2026',
      'time~and~is:9%3A14',
      'time~and~is:09%3A14%3A30.500',
      'time~and~before:2026-09-14T09%3A14',
      'datetime~and~is:2026-09-14T9',
      'datetime~and~is:2026-09-14 09%3A14',
      'datetime~and~is:2026-09-14T09%3A14%3A30Z',
      'boolean~and~is:maybe',
      'number~and~between:1',
      'text~and~contains:a~contains:b~contains:c',
    ]) {
      expect(parseFilter(text)).toBeNull();
    }
  });

  it('reads every prefix of the canonical time and date-time text cut at a field', () => {
    for (const value of ['09', '09:14', '09:14:30']) {
      expect(parseFilter(`time~and~is:${encodeURIComponent(value)}`)?.conditions[0]?.value).toBe(
        value,
      );
    }
    for (const value of [
      '2026-09-14',
      '2026-09-14T09',
      '2026-09-14T09:14',
      '2026-09-14T09:14:30',
    ]) {
      expect(
        parseFilter(`datetime~and~is:${encodeURIComponent(value)}`)?.conditions[0]?.value,
      ).toBe(value);
    }
  });

  it('reads null and undefined as no filter', () => {
    expect(parseFilter(null)).toBeNull();
    expect(parseFilter(undefined)).toBeNull();
  });
});

describe('toFilterParams and fromFilterParams', () => {
  it('names each column once, under a prefix a consumer can change', () => {
    const params = toFilterParams({
      status: setFilter(['paid']),
      name: { kind: 'text', join: 'and', conditions: [{ operator: 'contains', value: 'ana' }] },
    });
    expect(params.get('f.status')).toBe('set~and~anyOf:paid');
    expect(params.get('f.name')).toBe('text~and~contains:ana');
    expect(toFilterParams({ status: setFilter(['paid']) }, { prefix: 'q_' }).get('q_status')).toBe(
      'set~and~anyOf:paid',
    );
  });

  it('leaves out a column whose filter holds nothing', () => {
    const params = toFilterParams({ status: null, name: emptyFilter('text') });
    expect([...params.keys()]).toEqual([]);
  });

  it('reads a query string back into one filter per column', () => {
    const filters = fromFilterParams(new URLSearchParams('page=2&f.status=set~and~anyOf:paid'));
    expect(Object.keys(filters)).toEqual(['status']);
    expect(filters['status']).toEqual(setFilter(['paid']));
  });

  it('drops a column it cannot read rather than failing the whole screen', () => {
    const filters = fromFilterParams(
      new URLSearchParams('f.status=set~and~anyOf:paid&f.total=number~and~fromTheFuture:3'),
    );
    expect(Object.keys(filters)).toEqual(['status']);
  });

  it('takes a plain string, so a router that hands one over needs no wrapper', () => {
    expect(fromFilterParams('?f.paid=boolean~and~is:true')['paid']).toEqual({
      kind: 'boolean',
      join: 'and',
      conditions: [{ operator: 'is', value: true }],
    });
  });
});
