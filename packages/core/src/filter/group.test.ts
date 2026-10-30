import { describe, expect, it } from 'vitest';

import {
  createFilterGroupPredicate,
  createSearchPredicate,
  describeFilterGroup,
  emptyFilterGroup,
  fieldsOf,
  firstLevelRules,
  fromFilterBarParams,
  insertNodeAt,
  isFilterGroupActive,
  normalizeFilterGroup,
  parseFilterGroup,
  removeNodeAt,
  ruleFor,
  serializeFilterGroup,
  toFilterBarParams,
  updateNodeAt,
  withGroupJoin,
  withRuleFor,
  type FilterGroup,
} from './group';
import type { FilterDescriptor } from './descriptor';

const status: FilterDescriptor = {
  kind: 'set',
  join: 'and',
  conditions: [{ operator: 'anyOf', value: ['paid', 'refunded'] }],
};
const amount: FilterDescriptor = {
  kind: 'number',
  join: 'and',
  conditions: [{ operator: 'greaterThan', value: 100 }],
};
const customer: FilterDescriptor = {
  kind: 'text',
  join: 'and',
  conditions: [{ operator: 'contains', value: 'ana' }],
};
const unfinished: FilterDescriptor = {
  kind: 'text',
  join: 'and',
  conditions: [{ operator: 'contains' }],
};

const tree: FilterGroup = {
  join: 'and',
  rules: [
    { field: 'status', filter: status },
    {
      join: 'or',
      rules: [
        { field: 'amount', filter: amount },
        { field: 'customer', filter: customer },
      ],
    },
  ],
};

const rows = [
  { id: 1, status: 'paid', amount: 250, customer: 'Ana Souza' },
  { id: 2, status: 'paid', amount: 40, customer: 'Bruno Lima' },
  { id: 3, status: 'draft', amount: 900, customer: 'Ana Costa' },
  { id: 4, status: 'refunded', amount: 12, customer: 'Mariana' },
];
const read = (row: (typeof rows)[number], field: string) => row[field as keyof typeof row];

describe('normalizeFilterGroup', () => {
  it('drops an unfinished leaf, and a group that is then empty', () => {
    const group: FilterGroup = {
      join: 'and',
      rules: [
        { field: 'status', filter: status },
        { join: 'or', rules: [{ field: 'customer', filter: unfinished }] },
      ],
    };
    expect(normalizeFilterGroup(group)).toEqual({
      join: 'and',
      rules: [{ field: 'status', filter: status }],
    });
  });

  it('is null when nothing is active', () => {
    expect(normalizeFilterGroup(emptyFilterGroup())).toBeNull();
    expect(
      normalizeFilterGroup({ join: 'or', rules: [{ field: 'a', filter: unfinished }] }),
    ).toBeNull();
    expect(isFilterGroupActive(null)).toBe(false);
    expect(isFilterGroupActive(tree)).toBe(true);
  });
});

describe('the first level as a map', () => {
  it('reads and writes one field, and leaves a deeper rule for the same field alone', () => {
    expect(ruleFor(tree, 'status')).toBe(status);
    expect(ruleFor(tree, 'amount')).toBeUndefined();
    const next = withRuleFor(tree, 'amount', amount);
    expect(firstLevelRules(next).map((rule) => rule.field)).toEqual(['status', 'amount']);
    expect(next.rules[1]).toBe(tree.rules[1]);
  });

  it('removes with null, and starts a group from nothing', () => {
    expect(withRuleFor(tree, 'status', null).rules).toHaveLength(1);
    expect(withRuleFor(null, 'status', status)).toEqual({
      join: 'and',
      rules: [{ field: 'status', filter: status }],
    });
  });
});

describe('the builder edits', () => {
  it('updates, removes and inserts at a path', () => {
    const replaced = updateNodeAt(tree, [1, 0], { field: 'amount', filter: customer });
    expect((replaced.rules[1] as FilterGroup).rules[0]).toEqual({
      field: 'amount',
      filter: customer,
    });

    const removed = removeNodeAt(tree, [1, 1]);
    expect((removed.rules[1] as FilterGroup).rules).toHaveLength(1);

    const inserted = insertNodeAt(tree, [1], { field: 'status', filter: status }, 0);
    expect((inserted.rules[1] as FilterGroup).rules[0]).toEqual({
      field: 'status',
      filter: status,
    });

    expect(withGroupJoin(tree, [1], 'and').rules[1]).toMatchObject({ join: 'and' });
    expect(withGroupJoin(tree, [0], 'or')).toBe(tree);
  });

  it('never removes the root and never inserts into a leaf', () => {
    expect(removeNodeAt(tree, [])).toBe(tree);
    expect(insertNodeAt(tree, [0], { field: 'x', filter: status })).toBe(tree);
  });

  it('names every field once', () => {
    expect(fieldsOf(tree)).toEqual(['status', 'amount', 'customer']);
  });
});

describe('createFilterGroupPredicate', () => {
  it('composes and over or, one predicate per leaf', () => {
    const keep = createFilterGroupPredicate(tree, read);
    expect(rows.filter(keep).map((row) => row.id)).toEqual([1, 4]);
  });

  it('matches everything with no active rule', () => {
    expect(rows.filter(createFilterGroupPredicate(null, read))).toHaveLength(4);
    const unfinishedOr: FilterGroup = {
      join: 'or',
      rules: [
        { field: 'customer', filter: unfinished },
        { field: 'status', filter: status },
      ],
    };
    expect(rows.filter(createFilterGroupPredicate(unfinishedOr, read)).map((r) => r.id)).toEqual([
      1, 2, 4,
    ]);
  });
});

describe('createSearchPredicate', () => {
  it('finds the query in any named field through the collator', () => {
    // language: pt-BR
    const keep = createSearchPredicate('ána', read, ['customer', 'status']);
    // language: en-US
    expect(rows.filter(keep).map((row) => row.id)).toEqual([1, 3, 4]);
  });

  it('matches everything on a blank query', () => {
    expect(rows.filter(createSearchPredicate('  ', read, ['customer']))).toHaveLength(4);
  });
});

describe('describeFilterGroup', () => {
  const format = {
    field: (field: string) =>
      ({ status: 'Status', amount: 'Amount', customer: 'Customer' })[field]!,
    operator: (operator: string) =>
      ({ anyOf: 'any of', greaterThan: 'greater than', contains: 'contains' })[operator]!,
    join: (join: string) => join,
  };

  it('brackets a nested group and not the root', () => {
    expect(describeFilterGroup(tree, format)).toBe(
      'Status any of paid, refunded and (Amount greater than 100 or Customer contains ana)',
    );
    expect(describeFilterGroup(null, format)).toBe('');
  });
});

describe('the URL form', () => {
  it('writes the tree compactly and reads it back', () => {
    const written = serializeFilterGroup(tree);
    expect(written).toBe(
      'and(status~set~and~anyOf:paid,refunded|or(amount~number~and~greaterThan:100|customer~text~and~contains:ana))',
    );
    expect(parseFilterGroup(written)).toEqual(tree);
  });

  it('shields the three structural characters inside an operand and a field key', () => {
    const hostile: FilterGroup = {
      join: 'or',
      rules: [
        {
          field: 'a|b(c)',
          filter: {
            kind: 'text',
            join: 'and',
            conditions: [{ operator: 'equals', value: 'x|y(z)~' }],
          },
        },
      ],
    };
    const written = serializeFilterGroup(hostile);
    expect(written).not.toMatch(/\|y/);
    expect(parseFilterGroup(written)).toEqual(hostile);
  });

  it('is total', () => {
    expect(parseFilterGroup('')).toBeNull();
    expect(parseFilterGroup('and(')).toBeNull();
    expect(parseFilterGroup('xor(a~text~and~contains:b)')).toBeNull();
    expect(parseFilterGroup('and()')).toBeNull();
    expect(parseFilterGroup('and(a~text~and~contains:b')).toBeNull();
    expect(parseFilterGroup('and(a~text~and~contains:b))')).toBeNull();
    expect(parseFilterGroup('and(a~text~and~shout:b)')).toBeNull();
    expect(parseFilterGroup('and(~text~and~contains:b)')).toBeNull();
    expect(parseFilterGroup('and(a~text~and~contains:b|)')).toBeNull();
  });

  it('carries the query beside the tree, and reads per-column parameters without one', () => {
    const params = toFilterBarParams({ filter: tree, query: ' ana ' });
    expect(params.get('q')).toBe('ana');
    expect(fromFilterBarParams(params)).toEqual({ filter: tree, query: 'ana' });

    expect(toFilterBarParams({ filter: null, query: '' }).toString()).toBe('');

    const columns = new URLSearchParams('f.status=set~and~anyOf:paid&q=x&f.broken=nope');
    expect(fromFilterBarParams(columns)).toEqual({
      filter: {
        join: 'and',
        rules: [
          {
            field: 'status',
            filter: {
              kind: 'set',
              join: 'and',
              conditions: [{ operator: 'anyOf', value: ['paid'] }],
            },
          },
        ],
      },
      query: 'x',
    });
  });
});
