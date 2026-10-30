import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_VIEW_ID,
  columnStateChanges,
  columnsOutOfSpace,
  emptyGridView,
  emptySavedViews,
  GRID_VIEW_VERSION,
  normalizeColumnState,
  parseGridView,
  parseSavedViews,
  POPIN_COLUMN_ID,
  resolveColumnOverflow,
  resolveColumns,
  sameGridView,
  sameSavedView,
  savedViewText,
  serializeGridView,
  serializeSavedViews,
  withActiveView,
  withColumnHidden,
  withColumnPinned,
  withColumnWidth,
  withDefaultView,
  withViewCreated,
  withViewDeleted,
  withViewRenamed,
  withViewSaved,
  type GridColumn,
  type GridView,
} from './index';

const columns: GridColumn[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'status', label: 'Status', width: 120, priority: 1, description: 'Where the order is' },
  { id: 'total', label: 'Total', width: 120, priority: 2 },
  { id: 'owner', label: 'Owner', width: 160, priority: 3 },
  { id: 'notes', label: 'Notes', flex: 1, minWidth: 100, priority: 3 },
];

describe('resolveColumnOverflow', () => {
  it('pops in under the compact width whatever the pointer', () => {
    expect(resolveColumnOverflow('auto', 599, false)).toBe('popin');
    expect(resolveColumnOverflow('auto', 360, true)).toBe('popin');
    expect(resolveColumnOverflow('auto', 600, false)).toBe('scroll');
  });

  it('pops in under the expanded width only for a coarse pointer', () => {
    expect(resolveColumnOverflow('auto', 800, true)).toBe('popin');
    expect(resolveColumnOverflow('auto', 1023, true)).toBe('popin');
    expect(resolveColumnOverflow('auto', 1024, true)).toBe('scroll');
    expect(resolveColumnOverflow('auto', 800, false)).toBe('scroll');
    expect(resolveColumnOverflow('auto', 1280, false)).toBe('scroll');
  });

  it('keeps an explicit policy at every width', () => {
    expect(resolveColumnOverflow('popin', 1280, false)).toBe('popin');
    expect(resolveColumnOverflow('scroll', 360, true)).toBe('scroll');
  });

  it('scrolls before the frame is measured', () => {
    expect(resolveColumnOverflow('auto', 0, true)).toBe('scroll');
  });
});

describe('columnsOutOfSpace', () => {
  const resolved = resolveColumns(columns, normalizeColumnState(null, columns));
  const none = { popin: [], hidden: [] };

  it('takes nothing out while every column fits, and nothing before the frame is measured', () => {
    expect(columnsOutOfSpace(resolved, 2000)).toEqual(none);
    expect(columnsOutOfSpace(resolved, 0)).toEqual(none);
  });

  it('takes the highest priority out first, the later of two equal ones first', () => {
    /* 200 + 120 + 120 + 160 + 100 = 700. */
    expect(columnsOutOfSpace(resolved, 690).popin).toEqual(['notes']);
    expect(columnsOutOfSpace(resolved, 500).popin).toEqual(['owner', 'notes']);
    expect(columnsOutOfSpace(resolved, 330).popin).toEqual(['total', 'owner', 'notes']);
  });

  it('counts the gutters, and keeps the first data column as the identity', () => {
    expect(columnsOutOfSpace(resolved, 700, { leading: 48 }).popin).toEqual(['notes']);
    expect(columnsOutOfSpace(resolved, 10).popin).toEqual(['status', 'total', 'owner', 'notes']);
    const one = resolveColumns([columns[1]!], normalizeColumnState(null, [columns[1]!]));
    expect(columnsOutOfSpace(one, 10)).toEqual(none);
  });

  /** 100 + 200 + 120 + 120 + 160 + 100 + 60 = 860. */
  const wide: GridColumn[] = [
    { id: 'code', label: 'Code', width: 100 },
    { id: 'name', label: 'Name', width: 200, rowHeader: true },
    { id: 'status', label: 'Status', width: 120, priority: 1 },
    { id: 'total', label: 'Total', width: 120, priority: 2, popin: false },
    { id: 'owner', label: 'Owner', width: 160, priority: 2 },
    { id: 'notes', label: 'Notes', flex: 1, minWidth: 100 },
    { id: 'actions', label: 'Actions', kind: 'actions', width: 60 },
  ];
  const wideResolved = resolveColumns(wide, normalizeColumnState(null, wide));

  it('takes the columns without a priority out first, the last in the row first', () => {
    expect(columnsOutOfSpace(wideResolved, 800)).toEqual({ popin: ['notes'], hidden: [] });
    expect(columnsOutOfSpace(wideResolved, 700)).toEqual({ popin: ['code', 'notes'], hidden: [] });
    expect(columnsOutOfSpace(wideResolved, 500)).toEqual({
      popin: ['code', 'owner', 'notes'],
      hidden: [],
    });
  });

  it('hides a column that declines the pop-in, and lists both in the order of the row', () => {
    expect(columnsOutOfSpace(wideResolved, 400)).toEqual({
      popin: ['code', 'owner', 'notes'],
      hidden: ['total'],
    });
  });

  it('never takes the row header or an actions column out', () => {
    expect(columnsOutOfSpace(wideResolved, 10)).toEqual({
      popin: ['code', 'status', 'owner', 'notes'],
      hidden: ['total'],
    });
  });

  it('takes the first visible data column as the identity when the row header is hidden', () => {
    const state = withColumnHidden(normalizeColumnState(null, wide), 'name', true);
    const withoutHeader = resolveColumns(wide, state);
    expect(columnsOutOfSpace(withoutHeader, 10).popin).toEqual(['status', 'owner', 'notes']);
    const actionsFirst: GridColumn[] = [
      { id: 'actions', label: 'Actions', kind: 'actions', width: 60 },
      { id: 'a', label: 'A', width: 200 },
      { id: 'b', label: 'B', width: 200 },
    ];
    const resolvedFirst = resolveColumns(actionsFirst, normalizeColumnState(null, actionsFirst));
    expect(columnsOutOfSpace(resolvedFirst, 10).popin).toEqual(['b']);
  });

  it('names the virtual column the cursor stands on in a pop-in', () => {
    expect(POPIN_COLUMN_ID).toBe('$popin');
  });
});

describe('columnStateChanges', () => {
  it('names every key that differs, in a fixed order', () => {
    const base = normalizeColumnState(null, columns);
    expect(columnStateChanges(base, base)).toEqual([]);
    const next = withColumnPinned(withColumnHidden(base, 'total', true), 'name', 'start');
    expect(columnStateChanges(base, next)).toEqual(['hidden', 'pinned']);
    expect(columnStateChanges(base, withColumnWidth(base, columns[0]!, 240))).toEqual(['width']);
    expect(
      columnStateChanges(
        { ...base, widths: { name: 240, total: 90 } },
        { ...base, widths: { total: 90, name: 240 } },
      ),
    ).toEqual([]);
    expect(columnStateChanges(base, { ...base, order: [...base.order].reverse() })).toEqual([
      'order',
    ]);
  });
});

describe('view with density', () => {
  it('writes the density and the version, and reads both back', () => {
    const view: GridView = { ...emptyGridView(), density: 'compact' };
    const text = serializeGridView(view, columns);
    expect(text).toBe(`density=compact&v=${GRID_VIEW_VERSION}`);
    expect(parseGridView(text, columns).density).toBe('compact');
  });

  it('reads an unknown density as none, a missing or later version as the known keys', () => {
    expect(parseGridView('density=huge&v=1').density).toBeNull();
    expect(parseGridView('density=dense').density).toBe('dense');
    expect(parseGridView('density=dense&v=9&extra=1').density).toBe('dense');
    expect(parseGridView('density=dense&v=abc').density).toBe('dense');
    expect(serializeGridView(emptyGridView(), columns)).toBe('');
  });

  it('compares two views by their text', () => {
    const a: GridView = {
      ...emptyGridView(),
      columns: normalizeColumnState(null, columns),
    };
    expect(sameGridView(a, emptyGridView(), columns)).toBe(true);
    expect(sameGridView(a, { ...a, density: 'dense' }, columns)).toBe(false);
  });
});

describe('saved views', () => {
  const view = serializeGridView({ ...emptyGridView(), density: 'dense' }, columns);

  it('creates, saves, renames, sets the default and deletes', () => {
    let state = withViewCreated(emptySavedViews(), 'Late orders', view, 'a');
    expect(state).toEqual({
      views: [{ id: 'a', name: 'Late orders', view }],
      defaultId: null,
      activeId: 'a',
    });
    state = withViewSaved(state, 'a', 'v=1');
    expect(state.views[0]!.view).toBe('v=1');
    state = withViewRenamed(state, 'a', '  Overdue  ');
    expect(state.views[0]!.name).toBe('Overdue');
    state = withDefaultView(state, 'a');
    expect(state.defaultId).toBe('a');
    state = withActiveView(state, null);
    expect(state.activeId).toBeNull();
    state = withViewDeleted(withActiveView(state, 'a'), 'a');
    expect(state).toEqual(emptySavedViews());
  });

  it('never touches the built-in view', () => {
    const state = withViewCreated(emptySavedViews(), 'Mine', view, 'a');
    expect(withViewRenamed(state, BUILT_IN_VIEW_ID, 'x')).toBe(state);
    expect(withViewDeleted(state, BUILT_IN_VIEW_ID)).toBe(state);
    expect(withViewSaved(state, BUILT_IN_VIEW_ID, 'v=1')).toBe(state);
    expect(withDefaultView(state, BUILT_IN_VIEW_ID).defaultId).toBeNull();
    expect(withActiveView(state, BUILT_IN_VIEW_ID).activeId).toBeNull();
  });

  it('round-trips through text, and reads anything malformed as nothing', () => {
    const state = withDefaultView(withViewCreated(emptySavedViews(), 'Mine', view, 'a'), 'a');
    expect(parseSavedViews(serializeSavedViews(state))).toEqual(state);
    expect(parseSavedViews('not json')).toEqual(emptySavedViews());
    expect(parseSavedViews(null)).toEqual(emptySavedViews());
    expect(
      parseSavedViews(
        JSON.stringify({
          v: 1,
          views: [
            { id: 'a', name: 'A', view: '' },
            { id: 'a', name: 'Twice', view: '' },
            { id: 3, name: 'Bad' },
            { id: 'b', name: 'B' },
          ],
          defaultId: 'gone',
          activeId: 'b',
        }),
      ),
    ).toEqual({
      views: [
        { id: 'a', name: 'A', view: '' },
        { id: 'b', name: 'B', view: '' },
      ],
      defaultId: null,
      activeId: 'b',
    });
  });

  it('keeps the page size and drops the page position', () => {
    const at = (index: number): GridView => ({
      ...emptyGridView(),
      query: { ...emptyGridView().query, page: { index, size: 50 } },
    });
    expect(sameSavedView(at(0), at(3), columns)).toBe(true);
    expect(
      sameSavedView(
        at(0),
        { ...at(0), query: { ...at(0).query, page: { index: 0, size: 25 } } },
        columns,
      ),
    ).toBe(false);
    expect(savedViewText(at(3), columns)).toBe(savedViewText(at(0), columns));
    expect(savedViewText(at(3), columns)).toContain('size=50');
  });
});
