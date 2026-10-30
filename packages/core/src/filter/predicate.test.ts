import { describe, expect, it } from 'vitest';

import { emptyFilter, setFilter } from './descriptor';
import type {
  DateFilter,
  DateTimeFilter,
  NumberFilter,
  TextFilter,
  TimeFilter,
} from './descriptor';
import { createFilterPredicate, createRowPredicate, matchesFilter } from './predicate';

const text = (
  conditions: TextFilter['conditions'],
  join: TextFilter['join'] = 'and',
): TextFilter => ({ kind: 'text', join, conditions });

const number = (
  conditions: NumberFilter['conditions'],
  join: NumberFilter['join'] = 'and',
): NumberFilter => ({ kind: 'number', join, conditions });

const date = (
  conditions: DateFilter['conditions'],
  join: DateFilter['join'] = 'and',
): DateFilter => ({ kind: 'date', join, conditions });

const time = (
  conditions: TimeFilter['conditions'],
  join: TimeFilter['join'] = 'and',
): TimeFilter => ({ kind: 'time', join, conditions });

const dateTime = (
  conditions: DateTimeFilter['conditions'],
  join: DateTimeFilter['join'] = 'and',
): DateTimeFilter => ({ kind: 'datetime', join, conditions });

describe('the empty condition', () => {
  it('matches everything, because there is nothing to match against', () => {
    expect(matchesFilter(null, 'anything')).toBe(true);
    expect(matchesFilter(undefined, 'anything')).toBe(true);
    expect(matchesFilter(emptyFilter('text'), 'anything')).toBe(true);
  });

  it('drops an inactive condition rather than letting it match everything under or', () => {
    const filter = text([{ operator: 'contains', value: 'ana' }, { operator: 'endsWith' }], 'or');
    expect(matchesFilter(filter, 'Ana Lima')).toBe(true);
    expect(matchesFilter(filter, 'Bruno')).toBe(false);
  });
});

describe('text', () => {
  it('ignores case and diacritics through the collator, not through a fold', () => {
    // language: pt-BR
    expect(matchesFilter(text([{ operator: 'contains', value: 'agua' }]), 'Água mineral')).toBe(
      true,
    );
    // language: en-US
    expect(matchesFilter(text([{ operator: 'equals', value: 'strasse' }]), 'Straße')).toBe(true);
  });

  it('answers the six comparisons', () => {
    const value = 'Ana Lima';
    expect(matchesFilter(text([{ operator: 'contains', value: 'na l' }]), value)).toBe(true);
    expect(matchesFilter(text([{ operator: 'notContains', value: 'zoe' }]), value)).toBe(true);
    expect(matchesFilter(text([{ operator: 'equals', value: 'ana lima' }]), value)).toBe(true);
    expect(matchesFilter(text([{ operator: 'notEquals', value: 'ana' }]), value)).toBe(true);
    expect(matchesFilter(text([{ operator: 'startsWith', value: 'ana' }]), value)).toBe(true);
    expect(matchesFilter(text([{ operator: 'endsWith', value: 'lima' }]), value)).toBe(true);
  });

  it('reads a blank value as blank, and null and undefined with it', () => {
    for (const blank of ['', '   ', null, undefined]) {
      expect(matchesFilter(text([{ operator: 'empty' }]), blank)).toBe(true);
      expect(matchesFilter(text([{ operator: 'notEmpty' }]), blank)).toBe(false);
    }
    expect(matchesFilter(text([{ operator: 'notEmpty' }]), 'x')).toBe(true);
  });

  it('leaves a blank value out of every comparison that is not about blankness', () => {
    expect(matchesFilter(text([{ operator: 'notContains', value: 'ana' }]), null)).toBe(false);
  });
});

describe('number', () => {
  it('answers the six comparisons', () => {
    expect(matchesFilter(number([{ operator: 'equals', value: 10 }]), 10)).toBe(true);
    expect(matchesFilter(number([{ operator: 'notEquals', value: 10 }]), 11)).toBe(true);
    expect(matchesFilter(number([{ operator: 'greaterThan', value: 10 }]), 10)).toBe(false);
    expect(matchesFilter(number([{ operator: 'greaterThanOrEqual', value: 10 }]), 10)).toBe(true);
    expect(matchesFilter(number([{ operator: 'lessThan', value: 10 }]), 9)).toBe(true);
    expect(matchesFilter(number([{ operator: 'lessThanOrEqual', value: 10 }]), 10)).toBe(true);
  });

  it('includes both ends of a range', () => {
    const filter = number([{ operator: 'between', value: 10, end: 20 }]);
    expect([9, 10, 15, 20, 21].map((value) => matchesFilter(filter, value))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
  });

  it('orders a range a reader typed backwards, rather than matching nothing', () => {
    expect(matchesFilter(number([{ operator: 'between', value: 100, end: 10 }]), 50)).toBe(true);
  });

  it('reads a numeric string, and calls anything else blank', () => {
    expect(matchesFilter(number([{ operator: 'equals', value: 10 }]), '10')).toBe(true);
    expect(matchesFilter(number([{ operator: 'empty' }]), 'ten')).toBe(true);
    expect(matchesFilter(number([{ operator: 'empty' }]), null)).toBe(true);
  });
});

describe('date', () => {
  it('compares a day, whatever the row value is made of', () => {
    const filter = date([{ operator: 'is', value: '2026-09-10' }]);
    expect(matchesFilter(filter, '2026-09-10')).toBe(true);
    expect(matchesFilter(filter, { year: 2026, month: 9, day: 10 })).toBe(true);
    expect(matchesFilter(filter, new Date(2026, 8, 10, 9, 14))).toBe(true);
  });

  it('reads a timestamp as the day it falls on, not as an instant', () => {
    const filter = date([{ operator: 'is', value: '2026-09-10' }]);
    expect(matchesFilter(filter, '2026-09-10T23:59:00')).toBe(true);
    expect(matchesFilter(filter, '2026-09-11T00:01:00')).toBe(false);
  });

  it('answers before, after and between on days', () => {
    expect(matchesFilter(date([{ operator: 'before', value: '2026-09-10' }]), '2026-09-09')).toBe(
      true,
    );
    expect(matchesFilter(date([{ operator: 'after', value: '2026-09-10' }]), '2026-09-10')).toBe(
      false,
    );
    const range = date([{ operator: 'between', value: '2026-01-01', end: '2026-03-31' }]);
    expect(matchesFilter(range, '2026-03-31')).toBe(true);
    expect(matchesFilter(range, '2026-04-01')).toBe(false);
  });

  it('calls an unreadable date blank rather than throwing', () => {
    expect(matchesFilter(date([{ operator: 'empty' }]), 'not a date')).toBe(true);
    expect(matchesFilter(date([{ operator: 'is', value: '2026-09-10' }]), 'not a date')).toBe(
      false,
    );
  });
});

describe('time', () => {
  it('compares a time of day, whatever the row value is made of', () => {
    const filter = time([{ operator: 'is', value: '09:14' }]);
    expect(matchesFilter(filter, '09:14')).toBe(true);
    expect(matchesFilter(filter, '09:14:30')).toBe(true);
    expect(matchesFilter(filter, { hour: 9, minute: 14, second: 0 })).toBe(true);
    expect(
      matchesFilter(filter, {
        date: { year: 2026, month: 9, day: 14 },
        time: { hour: 9, minute: 14, second: 5 },
      }),
    ).toBe(true);
    expect(matchesFilter(filter, '2026-09-14T09:14:59')).toBe(true);
    expect(matchesFilter(filter, new Date(2026, 8, 14, 9, 14, 30))).toBe(true);
    expect(matchesFilter(filter, '09:15')).toBe(false);
  });

  it('compares at the precision the operand was written at, for every operator', () => {
    expect(matchesFilter(time([{ operator: 'is', value: '09' }]), '09:59:59')).toBe(true);
    expect(matchesFilter(time([{ operator: 'is', value: '09:14:30' }]), '09:14:31')).toBe(false);
    expect(matchesFilter(time([{ operator: 'after', value: '09:14' }]), '09:14:30')).toBe(false);
    expect(matchesFilter(time([{ operator: 'after', value: '09:14' }]), '09:15:00')).toBe(true);
    expect(matchesFilter(time([{ operator: 'before', value: '09:14' }]), '09:13:59')).toBe(true);
    expect(matchesFilter(time([{ operator: 'before', value: '09:14' }]), '09:14:00')).toBe(false);
    const range = time([{ operator: 'between', value: '09:00', end: '09:14' }]);
    expect(matchesFilter(range, '09:14:59')).toBe(true);
    expect(matchesFilter(range, '09:15:00')).toBe(false);
    expect(matchesFilter(range, '08:59:59')).toBe(false);
  });

  it('reads a range whose start is later than its end as a window across midnight', () => {
    const night = time([{ operator: 'between', value: '22:00', end: '02:00' }]);
    expect(
      ['23:00', '01:59', '22:00', '02:00:59'].map((value) => matchesFilter(night, value)),
    ).toEqual([true, true, true, true]);
    expect(['02:01', '12:00', '21:59'].map((value) => matchesFilter(night, value))).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('reads a Date as wall-clock time in the stated zone, never as an instant', () => {
    const filter = time([{ operator: 'is', value: '09:14' }]);
    const instant = new Date(Date.UTC(2026, 8, 14, 12, 14));
    expect(matchesFilter(filter, instant, { timeZone: 'America/Sao_Paulo' })).toBe(true);
    expect(matchesFilter(filter, instant, { timeZone: 'UTC' })).toBe(false);
    const midnight = new Date(Date.UTC(2026, 8, 14, 0, 0));
    expect(
      matchesFilter(time([{ operator: 'is', value: '00:00' }]), midnight, { timeZone: 'UTC' }),
    ).toBe(true);
  });

  it('calls an unreadable time blank rather than throwing', () => {
    expect(matchesFilter(time([{ operator: 'empty' }]), 'noon')).toBe(true);
    expect(matchesFilter(time([{ operator: 'empty' }]), null)).toBe(true);
    expect(matchesFilter(time([{ operator: 'notEmpty' }]), '09:14')).toBe(true);
    expect(matchesFilter(time([{ operator: 'is', value: 'noon' }]), '09:14')).toBe(false);
  });
});

describe('datetime', () => {
  it('compares a date and a time, whatever the row value is made of', () => {
    const filter = dateTime([{ operator: 'is', value: '2026-09-14T09:14' }]);
    expect(matchesFilter(filter, '2026-09-14T09:14')).toBe(true);
    expect(matchesFilter(filter, '2026-09-14T09:14:30')).toBe(true);
    expect(
      matchesFilter(filter, {
        date: { year: 2026, month: 9, day: 14 },
        time: { hour: 9, minute: 14, second: 5 },
      }),
    ).toBe(true);
    expect(matchesFilter(filter, new Date(2026, 8, 14, 9, 14, 30))).toBe(true);
    expect(matchesFilter(filter, '2026-09-14T09:15')).toBe(false);
    expect(matchesFilter(filter, '2026-09-15T09:14')).toBe(false);
  });

  it('compares at the precision the operand was written at, a day included', () => {
    expect(
      matchesFilter(dateTime([{ operator: 'is', value: '2026-09-14' }]), '2026-09-14T23:59:59'),
    ).toBe(true);
    expect(
      matchesFilter(dateTime([{ operator: 'is', value: '2026-09-14' }]), {
        year: 2026,
        month: 9,
        day: 14,
      }),
    ).toBe(true);
    expect(
      matchesFilter(dateTime([{ operator: 'after', value: '2026-09-14T09' }]), '2026-09-14T09:59'),
    ).toBe(false);
    expect(
      matchesFilter(dateTime([{ operator: 'after', value: '2026-09-14T09' }]), '2026-09-14T10:00'),
    ).toBe(true);
    const range = dateTime([{ operator: 'between', value: '2026-09-14', end: '2026-09-14T12:00' }]);
    expect(matchesFilter(range, '2026-09-14T00:00:00')).toBe(true);
    expect(matchesFilter(range, '2026-09-14T12:00:59')).toBe(true);
    expect(matchesFilter(range, '2026-09-14T12:01:00')).toBe(false);
  });

  it('orders a range a reader typed backwards, because a date-time pair has an order', () => {
    const range = dateTime([{ operator: 'between', value: '2026-09-20', end: '2026-09-10' }]);
    expect(matchesFilter(range, '2026-09-15T08:00')).toBe(true);
    expect(matchesFilter(range, '2026-09-25T08:00')).toBe(false);
  });

  it('reads a Date as wall-clock in the stated zone, never as an instant', () => {
    const filter = dateTime([{ operator: 'is', value: '2026-09-14T00:30' }]);
    const instant = new Date(Date.UTC(2026, 8, 14, 3, 30));
    expect(matchesFilter(filter, instant, { timeZone: 'America/Sao_Paulo' })).toBe(true);
    expect(matchesFilter(filter, instant, { timeZone: 'UTC' })).toBe(false);
  });

  it('calls an unreadable date-time blank rather than throwing', () => {
    expect(matchesFilter(dateTime([{ operator: 'empty' }]), 'yesterday')).toBe(true);
    expect(matchesFilter(dateTime([{ operator: 'notEmpty' }]), '2026-09-14')).toBe(true);
    expect(matchesFilter(dateTime([{ operator: 'is', value: 'yesterday' }]), '2026-09-14')).toBe(
      false,
    );
  });
});

describe('boolean', () => {
  it('answers the value the reader chose, false included', () => {
    const isTrue = { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] };
    const isFalse = {
      kind: 'boolean',
      join: 'and',
      conditions: [{ operator: 'is', value: false }],
    };
    expect(matchesFilter(isTrue as never, true)).toBe(true);
    expect(matchesFilter(isTrue as never, false)).toBe(false);
    expect(matchesFilter(isFalse as never, false)).toBe(true);
  });

  it('calls anything that is not a boolean blank', () => {
    const blank = { kind: 'boolean', join: 'and', conditions: [{ operator: 'empty' }] };
    expect(matchesFilter(blank as never, 'true')).toBe(true);
    expect(matchesFilter(blank as never, null)).toBe(true);
  });
});

describe('set', () => {
  it('keeps a value in the chosen list, and drops it out of the other direction', () => {
    expect(matchesFilter(setFilter(['paid', 'refunded']), 'paid')).toBe(true);
    expect(matchesFilter(setFilter(['paid'], 'noneOf'), 'paid')).toBe(false);
    expect(matchesFilter(setFilter(['paid'], 'noneOf'), 'open')).toBe(true);
  });

  it('matches element by element when the row holds a list of its own', () => {
    expect(matchesFilter(setFilter(['urgent']), ['new', 'urgent'])).toBe(true);
    expect(matchesFilter(setFilter(['urgent']), ['new'])).toBe(false);
    expect(matchesFilter(setFilter(['urgent'], 'noneOf'), ['new', 'urgent'])).toBe(false);
  });

  it('compares the value as it is written, because the list came from the data', () => {
    expect(matchesFilter(setFilter(['10']), 10)).toBe(true);
  });
});

describe('two conditions', () => {
  it('joins them with and', () => {
    const filter = number(
      [
        { operator: 'greaterThan', value: 10 },
        { operator: 'lessThan', value: 20 },
      ],
      'and',
    );
    expect([5, 15, 25].map((value) => matchesFilter(filter, value))).toEqual([false, true, false]);
  });

  it('joins them with or', () => {
    const filter = number(
      [
        { operator: 'lessThan', value: 10 },
        { operator: 'greaterThan', value: 20 },
      ],
      'or',
    );
    expect([5, 15, 25].map((value) => matchesFilter(filter, value))).toEqual([true, false, true]);
  });
});

describe('createFilterPredicate', () => {
  it('builds the comparison once and answers many values with it', () => {
    const keep = createFilterPredicate(text([{ operator: 'startsWith', value: 'a' }]));
    expect(['Ana', 'Bruno', 'Álvaro'].filter(keep)).toEqual(['Ana', 'Álvaro']);
  });

  it('takes the locale it compares in', () => {
    const keep = createFilterPredicate(text([{ operator: 'equals', value: 'resume' }]), {
      locale: 'fr',
      sensitivity: 'variant',
    });
    expect(keep('resumé')).toBe(false);
  });
});

describe('createRowPredicate', () => {
  it('filters four columns of four kinds without a switch of its own', () => {
    interface Row {
      name: string;
      amount: number;
      due: string;
      paid: boolean;
    }
    const rows: Row[] = [
      { name: 'Ana Lane', amount: 120, due: '2026-09-10', paid: true },
      { name: 'Bruno Day', amount: 40, due: '2026-10-02', paid: false },
      { name: 'Ana Moore', amount: 300, due: '2026-09-30', paid: true },
    ];

    const keep = createRowPredicate<Row>(
      {
        name: text([{ operator: 'startsWith', value: 'ana' }]),
        amount: number([{ operator: 'greaterThanOrEqual', value: 100 }]),
        due: date([{ operator: 'before', value: '2026-09-20' }]),
        paid: { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] },
      },
      (row, column) => row[column as keyof Row],
    );

    expect(rows.filter(keep).map((row) => row.name)).toEqual(['Ana Lane']);
  });

  it('ignores a column whose filter holds nothing', () => {
    const keep = createRowPredicate<{ name: string }>(
      { name: emptyFilter('text'), missing: null },
      (row, column) => row[column as 'name'],
    );
    expect(keep({ name: 'Ana' })).toBe(true);
  });
});
