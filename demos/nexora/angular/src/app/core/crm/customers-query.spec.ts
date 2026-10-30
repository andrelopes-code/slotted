import { setFilter } from '@slotted/core/filter';
import { emptyQuery, type GridQuery } from '@slotted/core/grid';
import { describe, expect, it } from 'vitest';

import { fromViewState, toCustomerListQuery, toViewFilters, toViewState } from './customers-query';
import { CUSTOMER_COLUMN_IDS, CUSTOMER_FILTER_KINDS } from './customers.store';

const base = emptyQuery({ index: 0, size: 25 });

describe('toCustomerListQuery', () => {
  it('writes the page, the sort and the search in the backend’s form', () => {
    const { query, flattened } = toCustomerListQuery({
      ...base,
      page: { index: 2, size: 50 },
      sort: [
        { column: 'overdueReceivables', direction: 'descending' },
        { column: 'displayName', direction: 'ascending' },
      ],
      search: 'meridian',
    });
    expect(query).toEqual({
      page: 3,
      pageSize: 50,
      sort: '-overdueReceivables,displayName',
      q: 'meridian',
    });
    expect(flattened).toBe(false);
  });

  /** The backend refuses a one-character query; one character is no search yet. */
  it('sends no search under two characters', () => {
    expect(toCustomerListQuery({ ...base, search: 'm' }).query.q).toBeUndefined();
    expect(toCustomerListQuery({ ...base, search: '  ' }).query.q).toBeUndefined();
  });

  it('translates a set, a text and a scaled number rule into filter clauses', () => {
    const { query } = toCustomerListQuery({
      ...base,
      filter: {
        join: 'and',
        rules: [
          { field: 'status', filter: setFilter(['active', 'on_hold']) },
          {
            field: 'accountOwnerName',
            filter: {
              kind: 'text',
              join: 'and',
              conditions: [{ operator: 'contains', value: 'sofia' }],
            },
          },
          {
            field: 'creditUtilizationBps',
            filter: {
              kind: 'number',
              join: 'and',
              conditions: [{ operator: 'between', value: 80, end: 120 }],
            },
          },
        ],
      },
    });
    expect(query.filter).toEqual({
      status: { in: ['active', 'on_hold'] },
      accountOwnerName: { contains: 'sofia' },
      creditUtilizationBps: { gte: 8000, lte: 12000 },
    });
  });

  /** The backend joins every clause with AND; an `or` or a nested group is applied flat and said so. */
  it('flattens a tree the backend cannot evaluate and says so', () => {
    const { query, flattened } = toCustomerListQuery({
      ...base,
      filter: {
        join: 'or',
        rules: [
          { field: 'status', filter: setFilter(['active']) },
          { join: 'and', rules: [{ field: 'health', filter: setFilter(['at_risk']) }] },
        ],
      },
    });
    expect(flattened).toBe(true);
    expect(query.filter).toEqual({ status: { in: ['active'] }, health: { in: ['at_risk'] } });
  });
});

describe('saved view state', () => {
  it('round-trips filters, sort, columns and page size through the view’s shape', () => {
    const query: GridQuery = {
      ...base,
      page: { index: 4, size: 100 },
      sort: [{ column: 'customerSince', direction: 'descending' }],
      filter: {
        join: 'and',
        rules: [
          { field: 'segment', filter: setFilter(['enterprise']) },
          {
            field: 'overdueReceivables',
            filter: {
              kind: 'number',
              join: 'and',
              conditions: [{ operator: 'greaterThanOrEqual', value: 5000 }],
            },
          },
          {
            field: 'customerSince',
            filter: {
              kind: 'date',
              join: 'and',
              conditions: [{ operator: 'after', value: '2024-01-01' }],
            },
          },
        ],
      },
    };
    const { state, lossy } = toViewState(
      query,
      { hidden: ['city', 'openTicketCount'] },
      CUSTOMER_COLUMN_IDS,
    );
    expect(lossy).toBe(false);
    expect(state.pageSize).toBe(100);
    expect(state.sort).toEqual([{ field: 'customerSince', direction: 'desc' }]);
    expect(state.filters).toEqual([
      { field: 'segment', operator: 'in', value: ['enterprise'] },
      { field: 'overdueReceivables', operator: 'gte', value: 500000 },
      { field: 'customerSince', operator: 'gte', value: '2024-01-01' },
    ]);
    expect(state.visibleColumns).not.toContain('city');

    const back = fromViewState(state, CUSTOMER_FILTER_KINDS, CUSTOMER_COLUMN_IDS);
    expect(back.query.page).toEqual({ index: 0, size: 100 });
    expect(back.query.sort).toEqual(query.sort);
    expect(back.query.filter).toEqual({
      join: 'and',
      rules: [
        {
          field: 'segment',
          filter: {
            kind: 'set',
            join: 'and',
            conditions: [{ operator: 'anyOf', value: ['enterprise'] }],
          },
        },
        {
          field: 'overdueReceivables',
          filter: {
            kind: 'number',
            join: 'and',
            conditions: [{ operator: 'greaterThanOrEqual', value: 5000 }],
          },
        },
        {
          field: 'customerSince',
          filter: {
            kind: 'date',
            join: 'and',
            conditions: [{ operator: 'after', value: '2024-01-01' }],
          },
        },
      ],
    });
    expect(back.columnState.hidden).toEqual(['city', 'openTicketCount']);
  });

  it('drops what the view cannot hold and says so', () => {
    const { filters, lossy } = toViewFilters({
      join: 'and',
      rules: [{ field: 'status', filter: setFilter(['closed'], 'noneOf') }],
    });
    expect(filters).toEqual([]);
    expect(lossy).toBe(true);
  });
});
