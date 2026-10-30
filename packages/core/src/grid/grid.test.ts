import { describe, expect, it } from 'vitest';

import {
  applyQuery,
  groupInOrder,
  type GridNode,
  cellText,
  columnRange,
  columnTemplate,
  compareValues,
  emptyColumnState,
  emptyQuery,
  fromGridParams,
  moveCursor,
  normalizeColumnState,
  parseColumnState,
  parseGridView,
  emptyGridView,
  serializeGridView,
  toCsv,
  rangeBounds,
  rangeEdges,
  rangeToText,
  rangeCells,
  resolveColumns,
  serializeColumnState,
  settleCursor,
  toGridParams,
  withColumnFilter,
  withColumnMoved,
  withColumnPinned,
  withColumnWidth,
  withPageIndex,
  withSearch,
  withSortPress,
  zoneOf,
  type CursorGrid,
  type GridColumn,
} from './index';

/** What a boolean cell says; the bindings take it from their catalog. */
const booleans = { true: 'Yes', false: 'No' };

interface Shipment {
  id: string;
  customer: string;
  carrier: string;
  weight: number | null;
  shipped: string;
  priority: boolean;
}

const rows: Shipment[] = [
  {
    id: 'S1',
    customer: 'Aurora',
    carrier: 'DHL',
    weight: 142.5,
    shipped: '2026-09-12',
    priority: true,
  },
  {
    id: 'S2',
    customer: 'bloom',
    carrier: 'UPS',
    weight: 18.2,
    shipped: '2026-09-10',
    priority: false,
  },
  {
    id: 'S3',
    customer: 'Nordwind',
    carrier: 'FedEx',
    weight: null,
    shipped: '2026-09-08',
    priority: true,
  },
  {
    id: 'S4',
    customer: 'Casa Verde',
    carrier: 'DHL',
    weight: 64.3,
    shipped: '2026-09-13',
    priority: false,
  },
  {
    id: 'S5',
    customer: 'Ärger',
    carrier: 'UPS',
    weight: 5.6,
    shipped: '2026-09-11',
    priority: false,
  },
];

const columns: GridColumn<Shipment>[] = [
  { id: 'id', label: 'Tracking', rowHeader: true, width: 120 },
  { id: 'customer', label: 'Customer', width: 180 },
  { id: 'carrier', label: 'Carrier', kind: 'set', options: [{ value: 'DHL', label: 'DHL' }] },
  { id: 'weight', label: 'Weight', kind: 'number', aggregate: 'sum', minWidth: 80, maxWidth: 200 },
  { id: 'shipped', label: 'Shipped', kind: 'date' },
  { id: 'priority', label: 'Priority', kind: 'boolean' },
  { id: 'actions', label: 'Actions', kind: 'actions', width: 72 },
];

const rowKey = (row: Shipment) => row.id;

describe('columns', () => {
  it('normalizes a saved state against the model: unknown columns leave, new ones land where declared', () => {
    const state = normalizeColumnState(
      {
        order: ['weight', 'ghost', 'id'],
        widths: { weight: 10, ghost: 99, customer: 300 },
        hidden: ['ghost', 'priority'],
        pinned: { start: ['id', 'ghost'], end: ['id', 'actions'] },
      },
      columns,
    );
    expect(state.order).toEqual([
      'weight',
      'id',
      'customer',
      'carrier',
      'shipped',
      'priority',
      'actions',
    ]);
    expect(state.widths).toEqual({ weight: 80, customer: 300 });
    expect(state.hidden).toEqual(['priority']);
    expect(state.pinned).toEqual({ start: ['id'], end: ['actions'] });
  });

  it('resolves the layout: start zone, middle, end zone, with summed pin offsets and 1-based indices', () => {
    const state = normalizeColumnState(
      { pinned: { start: ['id', 'customer'], end: ['actions'] }, hidden: ['shipped'] },
      columns,
    );
    const resolved = resolveColumns(columns, state);
    expect(resolved.map((column) => column.id)).toEqual([
      'id',
      'customer',
      'carrier',
      'weight',
      'priority',
      'actions',
    ]);
    expect(resolved.map((column) => column.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(resolved[0]).toMatchObject({ pinned: 'start', pinOffset: 0, pinEdge: false });
    expect(resolved[1]).toMatchObject({ pinned: 'start', pinOffset: 120, pinEdge: true });
    expect(resolved[5]).toMatchObject({ pinned: 'end', pinOffset: 0, pinEdge: true });
    expect(resolved[3]).toMatchObject({ numeric: true, sortable: true, filterable: true });
    expect(resolved[5]).toMatchObject({ sortable: false, filterable: false, searchable: false });
    /* The gutters a binding pins before the first column push the start zone
       along: without them the first pinned column stood over the chooser. */
    const behindGutters = resolveColumns(columns, state, { leading: 48 });
    expect(behindGutters[0]!.pinOffset).toBe(48);
    expect(behindGutters[1]!.pinOffset).toBe(168);
    expect(behindGutters[5]!.pinOffset).toBe(0);
  });

  it('writes one track per visible column, flex as minmax', () => {
    const resolved = resolveColumns(
      [
        { id: 'a', label: 'A', width: 100 },
        { id: 'b', label: 'B', flex: 1, minWidth: 60 },
      ],
      normalizeColumnState(null, [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ]),
    );
    expect(columnTemplate(resolved, [48])).toBe('48px 100px minmax(60px, 1fr)');
  });

  /** A resize writes a width; a flex track ignores one, so the drag moved nothing. */
  it('fixes a flex column once the reader has given it a width', () => {
    const model = [
      { id: 'a', label: 'A', width: 100 },
      { id: 'b', label: 'B', flex: 1, minWidth: 60 },
    ];
    const state = withColumnWidth(normalizeColumnState(null, model), model[1]!, 320);
    const resolved = resolveColumns(model, state);
    expect(resolved[1]!.flex).toBe(undefined);
    expect(columnTemplate(resolved)).toBe('100px 320px');
  });

  it('clamps a resize to the column’s bounds', () => {
    const state = withColumnWidth(emptyColumnState(), columns[3]!, 500);
    expect(state.widths['weight']).toBe(200);
    expect(withColumnWidth(state, columns[3]!, 3).widths['weight']).toBe(80);
  });

  it('moves a column inside its zone and never out of it', () => {
    const state = normalizeColumnState({ pinned: { start: ['id'], end: [] } }, columns);
    const resolved = resolveColumns(columns, state);
    const zone = zoneOf(resolved, 'weight');
    expect(zone).toEqual(['customer', 'carrier', 'weight', 'shipped', 'priority', 'actions']);
    const moved = withColumnMoved(state, 'weight', 0, zone);
    expect(moved.order).toEqual([
      'id',
      'weight',
      'customer',
      'carrier',
      'shipped',
      'priority',
      'actions',
    ]);
    expect(moved.pinned.start).toEqual(['id']);
  });

  it('pins and unpins through the state', () => {
    let state = withColumnPinned(emptyColumnState(), 'actions', 'end');
    state = withColumnPinned(state, 'id', 'start');
    expect(state.pinned).toEqual({ start: ['id'], end: ['actions'] });
    expect(withColumnPinned(state, 'id', null).pinned.start).toEqual([]);
  });

  it('round-trips the state through text, and parses anything without throwing', () => {
    const state = normalizeColumnState(
      {
        order: ['weight', 'id'],
        widths: { weight: 120 },
        hidden: ['priority'],
        pinned: { start: ['id'], end: ['actions'] },
      },
      columns,
    );
    const text = serializeColumnState(state, columns);
    expect(text).toBe(
      'o=weight,id,customer,carrier,shipped,priority,actions;w=weight:120;h=priority;ps=id;pe=actions',
    );
    expect(normalizeColumnState(parseColumnState(text), columns)).toEqual(state);
    expect(serializeColumnState(normalizeColumnState(null, columns), columns)).toBe('');
    expect(parseColumnState('garbage;;w=:x;o=')).toEqual(emptyColumnState());
  });
});

describe('toCsv', () => {
  it('writes RFC 4180: a header, CRLF, and quotes only where a field needs them', () => {
    const csvColumns: GridColumn<{
      id: string;
      name: string;
      note: string;
      weight: number | null;
      sent: boolean;
    }>[] = [
      { id: 'id', label: 'Id' },
      { id: 'name', label: 'Name, full' },
      { id: 'note', label: 'Note' },
      {
        id: 'weight',
        label: 'Weight',
        kind: 'number',
        format: (value) => (value === null ? '' : `${value} kg`),
      },
      { id: 'sent', label: 'Sent', kind: 'boolean' },
    ];
    const csv = toCsv(
      [
        { id: 'a', name: 'Anvil', note: 'He said "go"', weight: 1234.5, sent: true },
        { id: 'b', name: 'Bolt', note: 'two\nlines', weight: null, sent: false },
      ],
      csvColumns,
      { booleans },
    );
    expect(csv).toBe(
      'Id,"Name, full",Note,Weight,Sent\r\n' +
        'a,Anvil,"He said ""go""",1234.5 kg,Yes\r\n' +
        'b,Bolt,"two\nlines",,No\r\n',
    );
  });

  it('takes a delimiter, drops the header and leads with a mark on request', () => {
    const csv = toCsv(
      [{ id: 'a', n: 1.5 }],
      [
        { id: 'id', label: 'Id' },
        { id: 'n', label: 'N', kind: 'number' },
      ],
      { delimiter: ';', header: false, bom: true, locale: 'de-DE', booleans },
    );
    expect(csv).toBe('﻿a;1,5\r\n');
    expect(toCsv([], [], { booleans })).toBe('');
  });
});

describe('view', () => {
  it('is the query and the column state as one line, and nothing when untouched', () => {
    const view = {
      columns: normalizeColumnState({ widths: { weight: 120 }, hidden: ['priority'] }, columns),
      query: {
        ...emptyQuery({ index: 2, size: 25 }),
        sort: [{ column: 'weight', direction: 'descending' as const }],
      },
      density: null,
    };
    const text = serializeGridView(view, columns);
    expect(text).toBe(
      'sort=weight%3Adesc&page=3&size=25&columns=w%3Dweight%3A120%3Bh%3Dpriority&v=1',
    );
    expect(parseGridView(text, columns)).toEqual(view);
    expect(serializeGridView(emptyGridView(), columns)).toBe('');
    expect(parseGridView('%%%garbage')).toEqual(emptyGridView());
    expect(parseGridView('%%%garbage', columns).columns).toEqual(
      normalizeColumnState(null, columns),
    );
  });

  it('drops a column the model no longer has when it meets the model', () => {
    const text = 'columns=h%3Dpriority%2Cgone%3Bw%3Dgone%3A50';
    expect(parseGridView(text).columns.hidden).toEqual(['priority', 'gone']);
    expect(parseGridView(text, columns).columns).toEqual(
      normalizeColumnState({ hidden: ['priority'] }, columns),
    );
  });
});

describe('query', () => {
  it('cycles a key ascending, descending, gone, and replaces the order on a plain press', () => {
    let move = withSortPress(emptyQuery(), 'customer');
    expect(move.query.sort).toEqual([{ column: 'customer', direction: 'ascending' }]);
    move = withSortPress(move.query, 'customer');
    expect(move.query.sort).toEqual([{ column: 'customer', direction: 'descending' }]);
    move = withSortPress(move.query, 'weight', true);
    expect(move.query.sort).toEqual([
      { column: 'customer', direction: 'descending' },
      { column: 'weight', direction: 'ascending' },
    ]);
    move = withSortPress(move.query, 'customer', true);
    expect(move.query.sort).toEqual([{ column: 'weight', direction: 'ascending' }]);
    move = withSortPress(move.query, 'id');
    expect(move.query.sort).toEqual([{ column: 'id', direction: 'ascending' }]);
    expect(move.change).toBe('sort');
  });

  it('resets the page when the filter or the search moves, and keeps it on a sort of the same page', () => {
    const paged = withPageIndex(emptyQuery({ index: 0, size: 25 }), 3).query;
    expect(paged.page).toEqual({ index: 3, size: 25 });
    expect(withSearch(paged, 'nord').query.page).toEqual({ index: 0, size: 25 });
    expect(
      withColumnFilter(paged, 'customer', {
        kind: 'text',
        join: 'and',
        conditions: [{ operator: 'contains', value: 'a' }],
      }).query.page,
    ).toEqual({ index: 0, size: 25 });
  });

  it('edits one column’s rule in the first level and drops the group when it empties', () => {
    const filtered = withColumnFilter(emptyQuery(), 'carrier', {
      kind: 'set',
      join: 'and',
      conditions: [{ operator: 'anyOf', value: ['DHL'] }],
    }).query;
    expect(filtered.filter?.rules).toHaveLength(1);
    expect(withColumnFilter(filtered, 'carrier', null).query.filter).toBeNull();
  });

  it('round-trips through the URL, and reads a malformed bookmark as the default', () => {
    const query = withSortPress(
      withSearch(
        withColumnFilter(emptyQuery({ index: 2, size: 50 }), 'carrier', {
          kind: 'set',
          join: 'and',
          conditions: [{ operator: 'anyOf', value: ['DHL', 'UPS'] }],
        }).query,
        'nord',
      ).query,
      'weight',
    ).query;
    const withPage = withPageIndex(query, 2).query;
    const params = toGridParams(withPage);
    expect(params.get('sort')).toBe('weight:asc');
    expect(params.get('page')).toBe('3');
    expect(params.get('size')).toBe('50');
    expect(params.get('q')).toBe('nord');
    expect(fromGridParams(params)).toEqual(withPage);
    expect(fromGridParams('sort=weight:sideways&page=abc&size=x')).toEqual(emptyQuery());
    expect(fromGridParams('sort=weight:desc,weight:asc').sort).toEqual([
      { column: 'weight', direction: 'descending' },
    ]);
  });
});

describe('applyQuery', () => {
  it('filters, searches, sorts, groups and pages, in that order', () => {
    const query = {
      ...emptyQuery({ index: 0, size: 2 }),
      sort: [{ column: 'weight' as const, direction: 'descending' as const }],
      search: 'a',
    };
    const result = applyQuery(rows, columns, query, { rowKey, booleans });
    /* Every customer with an `a`: Aurora, Casa Verde, Ärger (base sensitivity). */
    expect(result.total).toBe(3);
    expect(result.rows.map((row) => row.id)).toEqual(['S1', 'S4', 'S5']);
    expect(result.nodes.map((node) => node.key)).toEqual(['S1', 'S4']);
    expect(result.hasMore).toBe(true);
    expect(result.aggregates).toEqual({ weight: 212.4 });
  });

  it('sorts by the kind: empty last, text through the collator, numbers as numbers', () => {
    const asc = applyQuery(
      rows,
      columns,
      { ...emptyQuery(), sort: [{ column: 'weight', direction: 'ascending' }] },
      { rowKey, booleans },
    );
    expect(asc.rows.map((row) => row.id)).toEqual(['S5', 'S2', 'S4', 'S1', 'S3']);
    const desc = applyQuery(
      rows,
      columns,
      { ...emptyQuery(), sort: [{ column: 'weight', direction: 'descending' }] },
      { rowKey, booleans },
    );
    expect(desc.rows.map((row) => row.id)).toEqual(['S1', 'S4', 'S2', 'S5', 'S3']);
    const text = applyQuery(
      rows,
      columns,
      { ...emptyQuery(), sort: [{ column: 'customer', direction: 'ascending' }] },
      { rowKey, locale: 'en', booleans },
    );
    expect(text.rows.map((row) => row.customer)).toEqual([
      'Ärger',
      'Aurora',
      'bloom',
      'Casa Verde',
      'Nordwind',
    ]);
    expect(compareValues('boolean', false, true)).toBeLessThan(0);
    expect(compareValues('date', '2026-09-12', '2026-09-08')).toBeGreaterThan(0);
  });

  it('groups by one or two columns, with counts and aggregates, and closes a group by key', () => {
    const query = {
      ...emptyQuery(),
      group: ['carrier', 'priority'],
      sort: [{ column: 'id' as const, direction: 'ascending' as const }],
    };
    const open = applyQuery(rows, columns, query, { rowKey, booleans });
    const keys = open.nodes.map((node) =>
      node.kind === 'group' ? `${node.level}:${node.key}` : node.key,
    );
    expect(keys).toEqual([
      '1:carrier=DHL',
      '2:carrier=DHL/priority=Yes',
      'S1',
      '2:carrier=DHL/priority=No',
      'S4',
      '1:carrier=UPS',
      '2:carrier=UPS/priority=No',
      'S2',
      'S5',
      '1:carrier=FedEx',
      '2:carrier=FedEx/priority=Yes',
      'S3',
    ]);
    const dhl = open.nodes[0]!;
    if (dhl.kind !== 'group') throw new Error('expected a group');
    expect(dhl.count).toBe(2);
    expect(dhl.aggregates).toEqual({ weight: 206.8 });
    const closed = applyQuery(rows, columns, query, {
      rowKey,
      booleans,
      expandedGroups: ['carrier=UPS', 'carrier=UPS/priority=No'],
    });
    expect(closed.nodes.map((node) => node.key)).toEqual([
      'carrier=DHL',
      'carrier=UPS',
      'carrier=UPS/priority=No',
      'S2',
      'S5',
      'carrier=FedEx',
    ]);
  });

  it('formats by kind and by the column’s own format', () => {
    expect(cellText(columns[3]!, rows[0]!, { locale: 'en-US', booleans })).toBe('142.5');
    expect(cellText(columns[3]!, rows[2]!, { booleans })).toBe('');
    expect(cellText(columns[5]!, rows[0]!, { booleans: { true: 'Yes', false: 'No' } })).toBe('Yes');
    expect(
      cellText({ ...columns[4]!, format: (value) => `on ${String(value)}` }, rows[0]!, {
        booleans,
      }),
    ).toBe('on 2026-09-12');
    expect(cellText(columns[4]!, rows[0]!, { locale: 'en-US', booleans })).toBe('Sep 12, 2026');
  });
});

describe('applyQuery with a tree', () => {
  interface Site {
    id: string;
    parent: string | null;
    name: string;
    stock: number;
  }
  const siteColumns: GridColumn<Site>[] = [
    { id: 'name', label: 'Name' },
    { id: 'stock', label: 'Stock', kind: 'number', aggregate: 'sum' },
  ];
  const sites: Site[] = [
    { id: 'pt', parent: null, name: 'Portugal', stock: 0 },
    { id: 'pt-lis', parent: 'pt', name: 'Lisboa', stock: 40 },
    { id: 'pt-lis-a', parent: 'pt-lis', name: 'Zona A', stock: 25 },
    { id: 'pt-lis-b', parent: 'pt-lis', name: 'Zona B', stock: 15 },
    { id: 'pt-por', parent: 'pt', name: 'Porto', stock: 30 },
    { id: 'es', parent: null, name: 'España', stock: 0 },
    { id: 'es-mad', parent: 'es', name: 'Madrid', stock: 50 },
    { id: 'orphan', parent: 'gone', name: 'Adrift', stock: 1 },
  ];
  const tree = { parentKey: (row: Site) => row.parent };
  const keys = (result: { nodes: readonly GridNode<Site>[] }) =>
    result.nodes.map((node) =>
      node.kind === 'row' ? `${'  '.repeat(node.level - 1)}${node.key}` : `#${node.key}`,
    );

  it('flattens the open branches in order, roots first, an orphan as a root', () => {
    const closed = applyQuery(sites, siteColumns, emptyQuery(), {
      rowKey: (row) => row.id,
      booleans,
      tree,
    });
    expect(keys(closed)).toEqual(['pt', 'es', 'orphan']);
    const node = closed.nodes[0]!;
    expect(node.kind === 'row' && [node.level, node.parent, node.childCount, node.open]).toEqual([
      1,
      null,
      2,
      false,
    ]);
    expect(closed.total).toBe(3);

    const open = applyQuery(sites, siteColumns, emptyQuery(), {
      rowKey: (row) => row.id,
      booleans,
      tree,
      expanded: ['pt', 'pt-lis'],
    });
    expect(keys(open)).toEqual([
      'pt',
      '  pt-lis',
      '    pt-lis-a',
      '    pt-lis-b',
      '  pt-por',
      'es',
      'orphan',
    ]);
    expect(open.total).toBe(7);
    expect(open.rows.map((row) => row.id)).toEqual(sites.map((row) => row.id));
    /* The summary is over every row the query kept, not over the open ones. */
    expect(open.aggregates['stock']).toBe(161);
  });

  it('sorts among siblings, and keeps an ancestor whose descendant matches the filter', () => {
    const sorted = applyQuery(
      sites,
      siteColumns,
      { ...emptyQuery(), sort: [{ column: 'stock', direction: 'descending' }] },
      { rowKey: (row) => row.id, booleans, tree, expanded: ['pt', 'pt-lis'] },
    );
    expect(keys(sorted)).toEqual([
      'orphan',
      'pt',
      '  pt-lis',
      '    pt-lis-a',
      '    pt-lis-b',
      '  pt-por',
      'es',
    ]);

    const searched = applyQuery(
      sites,
      siteColumns,
      { ...emptyQuery(), search: 'zona b' },
      { rowKey: (row) => row.id, booleans, tree, expanded: ['pt', 'pt-lis'] },
    );
    expect(keys(searched)).toEqual(['pt', '  pt-lis', '    pt-lis-b']);
    expect(searched.total).toBe(3);
    /* Closed, the branch that holds the match is still the one row shown. */
    const closedSearch = applyQuery(
      sites,
      siteColumns,
      { ...emptyQuery(), search: 'zona b' },
      { rowKey: (row) => row.id, booleans, tree },
    );
    expect(keys(closedSearch)).toEqual(['pt']);
  });

  it('pages over the flattened nodes, and ignores grouping', () => {
    const page = applyQuery(
      sites,
      siteColumns,
      { ...emptyQuery({ index: 1, size: 3 }), group: ['name'] },
      { rowKey: (row) => row.id, booleans, tree, expanded: ['pt', 'pt-lis'] },
    );
    expect(keys(page)).toEqual(['    pt-lis-b', '  pt-por', 'es']);
    expect(page.total).toBe(7);
    expect(page.hasMore).toBe(true);
    const first = page.nodes[0]!;
    expect(first.kind === 'row' && first.index).toBe(3);
  });
});

describe('cursor', () => {
  const grid: CursorGrid = {
    rows: ['header', 'S1', 'S2', 'S3', 'S4', 'S5', 'summary'],
    columns: ['id', 'customer', 'weight'],
    pageSize: 2,
    bodyStart: 1,
    bodyEnd: 6,
  };

  it('moves one cell, stops at the edges, pages and jumps to the body’s corners', () => {
    expect(moveCursor(grid, { row: 'S1', column: 'id' }, 'end')).toEqual({
      row: 'S1',
      column: 'customer',
    });
    expect(moveCursor(grid, { row: 'S1', column: 'weight' }, 'end')).toEqual({
      row: 'S1',
      column: 'weight',
    });
    expect(moveCursor(grid, { row: 'S1', column: 'id' }, 'up')).toEqual({
      row: 'header',
      column: 'id',
    });
    expect(moveCursor(grid, { row: 'header', column: 'id' }, 'up')).toEqual({
      row: 'header',
      column: 'id',
    });
    expect(moveCursor(grid, { row: 'S1', column: 'id' }, 'pageDown')).toEqual({
      row: 'S3',
      column: 'id',
    });
    expect(moveCursor(grid, { row: 'summary', column: 'id' }, 'pageDown')).toEqual({
      row: 'summary',
      column: 'id',
    });
    expect(moveCursor(grid, { row: 'S3', column: 'customer' }, 'first')).toEqual({
      row: 'S1',
      column: 'id',
    });
    expect(moveCursor(grid, { row: 'S3', column: 'customer' }, 'last')).toEqual({
      row: 'S5',
      column: 'weight',
    });
    expect(moveCursor(grid, { row: 'S3', column: 'customer' }, 'rowEnd')).toEqual({
      row: 'S3',
      column: 'weight',
    });
  });

  it('settles on the same index when its row is gone, and on nothing when the grid is empty', () => {
    const shrunk: CursorGrid = { ...grid, rows: ['header', 'S1', 'S2'], bodyEnd: 3 };
    expect(settleCursor(shrunk, { row: 'S5', column: 'weight' }, 5)).toEqual({
      row: 'S2',
      column: 'weight',
    });
    expect(settleCursor(shrunk, { row: 'S2', column: 'ghost' }, 2)).toEqual({
      row: 'S2',
      column: 'id',
    });
    expect(
      settleCursor({ ...grid, rows: [], bodyStart: 0, bodyEnd: 0 }, { row: 'S1', column: 'id' }, 1),
    ).toBeNull();
  });

  it('bounds a range from its two corners and names the edges each cell draws', () => {
    const range = {
      anchor: { row: 'S4', column: 'weight' },
      focus: { row: 'S2', column: 'customer' },
    };
    const bounds = rangeBounds(grid, range);
    expect(bounds).toEqual({ rowStart: 2, rowEnd: 4, columnStart: 1, columnEnd: 2 });
    expect(rangeEdges(grid, bounds, { row: 'S2', column: 'customer' })).toEqual({
      inside: true,
      edges: ['top', 'start'],
    });
    expect(rangeEdges(grid, bounds, { row: 'S3', column: 'weight' })).toEqual({
      inside: true,
      edges: ['end'],
    });
    expect(rangeEdges(grid, bounds, { row: 'S1', column: 'id' })).toEqual({
      inside: false,
      edges: [],
    });
    expect(rangeCells(grid, bounds)).toHaveLength(3);
    expect(rangeToText(rangeCells(grid, bounds), (cell) => `${cell.row}.${cell.column}`)).toBe(
      'S2.customer\tS2.weight\nS3.customer\tS3.weight\nS4.customer\tS4.weight',
    );
    expect(columnRange(grid, 'weight')).toEqual({
      anchor: { row: 'S1', column: 'weight' },
      focus: { row: 'S5', column: 'weight' },
    });
  });
});

/**
 * A server that pages by date sends rows already ordered for grouping. The
 * grid in server mode grouped nothing; the rows it is given are grouped in
 * the order given, and a value that comes back after another run heads a
 * group of its own.
 */
describe('groupInOrder', () => {
  interface Entry {
    id: string;
    date: string;
    amount: number;
  }
  const columns = [
    { id: 'date', label: 'Date' },
    { id: 'amount', label: 'Amount', kind: 'number' as const, aggregate: 'sum' as const },
  ];
  const rows: Entry[] = [
    { id: 'a', date: '2026-10-03', amount: 1 },
    { id: 'b', date: '2026-10-03', amount: 2 },
    { id: 'c', date: '2026-10-02', amount: 3 },
    { id: 'd', date: '2026-10-02', amount: 4 },
    { id: 'e', date: '2026-10-01', amount: 5 },
    { id: 'f', date: '2026-10-01', amount: 6 },
  ];

  it('groups consecutive rows by value, in the order given, with counts and aggregates', () => {
    const nodes = groupInOrder(rows, columns, ['date'], { rowKey: (row) => row.id, booleans });
    const groups = nodes.filter((node) => node.kind === 'group');
    expect(groups.map((node) => node.kind === 'group' && node.text)).toEqual([
      '2026-10-03',
      '2026-10-02',
      '2026-10-01',
    ]);
    expect(groups.map((node) => node.kind === 'group' && node.count)).toEqual([2, 2, 2]);
    expect(groups.map((node) => node.kind === 'group' && node.aggregates['amount'])).toEqual([
      3, 7, 11,
    ]);
    expect(nodes.filter((node) => node.kind === 'row').map((node) => node.key)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
  });

  it('keys a value that comes back after another run apart, and keeps the order', () => {
    const interleaved = [rows[0]!, rows[2]!, rows[1]!];
    const nodes = groupInOrder(interleaved, columns, ['date'], {
      rowKey: (row) => row.id,
      booleans,
    });
    const keys = nodes.filter((node) => node.kind === 'group').map((node) => node.key);
    expect(keys).toEqual(['date=2026-10-03', 'date=2026-10-02', 'date=2026-10-03~2']);
    expect(nodes.filter((node) => node.kind === 'row').map((node) => node.key)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('shows no rows under a closed group, and numbers rows from the offset', () => {
    const nodes = groupInOrder(rows, columns, ['date'], {
      rowKey: (row) => row.id,
      booleans,
      expandedGroups: ['date=2026-10-02'],
      offset: 40,
    });
    const shown = nodes.filter((node) => node.kind === 'row');
    expect(shown.map((node) => node.key)).toEqual(['c', 'd']);
    expect(shown.map((node) => node.kind === 'row' && node.index)).toEqual([42, 43]);
  });
});

/**
 * A column of kind `actions` scrolled out of the frame with the columns, and
 * the row's menu with it, unless the application pinned it by hand.
 */
describe('the actions column', () => {
  const model = [
    { id: 'name', label: 'Name', rowHeader: true },
    { id: 'amount', label: 'Amount', kind: 'number' as const },
    { id: 'actions', label: 'Actions', kind: 'actions' as const },
  ];

  it('is pinned to the end while no state says where columns are pinned', () => {
    expect(normalizeColumnState(undefined, model).pinned).toEqual({ start: [], end: ['actions'] });
    expect(normalizeColumnState({ widths: { amount: 120 } }, model).pinned.end).toEqual([
      'actions',
    ]);
  });

  it('stays where a state or its own column model puts it', () => {
    expect(normalizeColumnState({ pinned: { start: [], end: [] } }, model).pinned.end).toEqual([]);
    expect(
      normalizeColumnState(undefined, [...model.slice(0, 2), { ...model[2]!, pinned: null }]).pinned
        .end,
    ).toEqual([]);
  });

  it('writes no pins for the model’s own, and both lists once the reader moved them', () => {
    const untouched = normalizeColumnState(undefined, model);
    expect(serializeColumnState(untouched, model)).toBe('');
    const unpinned = normalizeColumnState({ pinned: { start: [], end: [] } }, model);
    const text = serializeGridView(
      { columns: unpinned, query: emptyQuery(), density: null },
      model,
    );
    expect(parseGridView(text, model).columns.pinned.end).toEqual([]);
    expect(parseGridView('', model).columns.pinned.end).toEqual(['actions']);
  });
});
