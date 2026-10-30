import { describe, expect, it } from 'vitest';

import {
  cellAt,
  DASHBOARD_SUBROWS,
  dashboardKeyIntent,
  handleShortcuts,
  layoutsEqual,
  materializeLayout,
  mediumSpan,
  moveTile,
  moveTileBy,
  parseDashboardLayout,
  parseDuration,
  resizeTile,
  resizeTileBy,
  resizeTileInClass,
  resolveColumns,
  resolveTiles,
  serializeDashboardLayout,
  setTileHidden,
  sizeClassOf,
  spanFromTravel,
  swapTiles,
  tileStyle,
} from './index';
import type { DashboardLayout, DashboardTile, DashboardWidgetSpec } from './index';

const grid = resolveColumns(12);

const widgets: DashboardWidgetSpec[] = [
  { key: 'a', defaultColumns: 3, defaultRows: 2 },
  { key: 'b', defaultColumns: 3, defaultRows: 2 },
  { key: 'c', defaultColumns: 6, defaultRows: 2, minColumns: 4, maxColumns: 8, maxRows: 4 },
  { key: 'd', defaultColumns: 12, defaultRows: 3 },
];

const place = (tiles: readonly DashboardTile[]) =>
  Object.fromEntries(tiles.filter((t) => !t.hidden).map((t) => [t.key, [t.x, t.y, t.w, t.h]]));

const keys = (tiles: readonly DashboardTile[]) => tiles.filter((t) => !t.hidden).map((t) => t.key);

const at = (layout: DashboardLayout, key: string, specs = widgets) =>
  resolveTiles(layout, specs, grid).find((t) => t.key === key);

describe('resolveColumns', () => {
  it('derives the medium and compact counts', () => {
    expect(resolveColumns(12)).toEqual({ expanded: 12, medium: 6, compact: 1 });
    expect(resolveColumns({ expanded: 8, compact: 2 })).toEqual({
      expanded: 8,
      medium: 4,
      compact: 2,
    });
    expect(resolveColumns(0)).toEqual({ expanded: 1, medium: 1, compact: 1 });
  });
});

describe('resolveTiles', () => {
  it('places widgets the layout does not name at the first place they fit', () => {
    expect(place(resolveTiles([], widgets, grid))).toEqual({
      a: [0, 0, 3, 2],
      b: [3, 0, 3, 2],
      c: [6, 0, 6, 2],
      d: [0, 2, 12, 3],
    });
  });

  it('pulls every widget up until something stops it', () => {
    const layout: DashboardLayout = [
      { key: 'a', x: 0, y: 5, w: 3, h: 2 },
      { key: 'b', x: 0, y: 9, w: 3, h: 2 },
    ];
    expect(place(resolveTiles(layout, widgets.slice(0, 2), grid))).toEqual({
      a: [0, 0, 3, 2],
      b: [0, 2, 3, 2],
    });
  });

  it('pushes a widget that overlaps another below it', () => {
    const layout: DashboardLayout = [
      { key: 'a', x: 0, y: 0, w: 6, h: 2 },
      { key: 'b', x: 3, y: 0, w: 6, h: 2 },
    ];
    expect(place(resolveTiles(layout, widgets.slice(0, 2), grid))).toEqual({
      a: [0, 0, 6, 2],
      b: [3, 2, 6, 2],
    });
  });

  it('holds places and sizes within the widget and the columns, and keeps the stored value', () => {
    const layout: DashboardLayout = [{ key: 'c', x: 10, y: 0, w: 20, h: 9 }];
    const c = at(layout, 'c', [widgets[2]!]);
    expect([c?.x, c?.w, c?.h]).toEqual([4, 8, 4]);
    expect(layout[0]?.w).toBe(20);
  });

  it('draws in reading order: row, then column', () => {
    const layout: DashboardLayout = [
      { key: 'd', x: 0, y: 2, w: 12, h: 3 },
      { key: 'b', x: 6, y: 0, w: 3, h: 2 },
      { key: 'a', x: 0, y: 0, w: 3, h: 2 },
    ];
    expect(keys(resolveTiles(layout, widgets, grid))).toEqual(['a', 'b', 'd', 'c']);
  });

  it('keeps a pinned widget where it is and moves the others around it', () => {
    const pinned = widgets.map((w) => (w.key === 'b' ? { ...w, movable: false } : w));
    const layout: DashboardLayout = [
      { key: 'b', x: 0, y: 3, w: 3, h: 2 },
      { key: 'a', x: 0, y: 0, w: 3, h: 4 },
    ];
    expect(place(resolveTiles(layout, pinned.slice(0, 2), grid))).toEqual({
      b: [0, 3, 3, 2],
      a: [0, 5, 3, 4],
    });
  });

  it('skips an entry no widget holds and a repeated key', () => {
    const layout: DashboardLayout = [
      { key: 'zz', x: 0, y: 0, w: 3, h: 2 },
      { key: 'a', x: 0, y: 0, w: 3, h: 2 },
      { key: 'a', x: 6, y: 0, w: 6, h: 2 },
    ];
    const tiles = resolveTiles(layout, widgets.slice(0, 1), grid);
    expect(keys(tiles)).toEqual(['a']);
    expect(tiles[0]?.w).toBe(3);
  });
});

describe('mediumSpan', () => {
  it('snaps a widget to a half or the whole of the medium class', () => {
    expect(mediumSpan(3, grid)).toBe(3);
    expect(mediumSpan(4, grid)).toBe(3);
    expect(mediumSpan(6, grid)).toBe(3);
    expect(mediumSpan(8, grid)).toBe(6);
  });
});

describe('tileStyle', () => {
  it('names the placement as the private properties the stylesheet reads', () => {
    const a = at([{ key: 'a', x: 2, y: 1, w: 3, h: 2 }], 'a', widgets.slice(0, 1));
    expect(tileStyle(a!)).toEqual({
      '--_dg-x': '3',
      '--_dg-y': '1',
      '--_dg-w': '3',
      '--_dg-h': String(2 * DASHBOARD_SUBROWS),
      '--_dg-span-medium': '3',
    });
  });
});

describe('materializeLayout', () => {
  it('writes every widget where it is drawn, and keeps entries no widget holds', () => {
    const layout = materializeLayout([{ key: 'zz', x: 0, y: 0, w: 2, h: 2 }], widgets, grid);
    expect(layout.map((item) => item.key)).toEqual(['a', 'b', 'c', 'd', 'zz']);
    expect(layout[0]).toEqual({ key: 'a', x: 0, y: 0, w: 3, h: 2 });
  });
});

describe('moveTile', () => {
  it('puts a widget in a cell and pushes what it covers below it', () => {
    const moved = moveTile([], widgets, grid, 'd', { x: 0, y: 0 });
    expect(place(resolveTiles(moved, widgets, grid))).toEqual({
      d: [0, 0, 12, 3],
      a: [0, 3, 3, 2],
      b: [3, 3, 3, 2],
      c: [6, 3, 6, 2],
    });
  });

  it('keeps a widget inside the columns', () => {
    expect(at(moveTile([], widgets, grid, 'a', { x: 11, y: 0 }), 'a')?.x).toBe(9);
  });

  it('moves a widget into free space on its row', () => {
    const layout: DashboardLayout = [{ key: 'a', x: 0, y: 0, w: 3, h: 2 }];
    const moved = moveTile(layout, widgets.slice(0, 1), grid, 'a', { x: 5, y: 0 });
    expect(moved[0]).toMatchObject({ x: 5, y: 0 });
  });

  it('refuses to move a pinned widget', () => {
    const pinned = widgets.map((w) => (w.key === 'a' ? { ...w, movable: false } : w));
    const before = materializeLayout([], pinned, grid);
    expect(layoutsEqual(moveTile([], pinned, grid, 'a', { x: 6, y: 4 }), before)).toBe(true);
  });
});

describe('moveTileBy', () => {
  it('steps along a row, and swaps with the widget above or below', () => {
    expect(at(moveTileBy([], widgets, grid, 'a', 'right', 'expanded'), 'a')).toMatchObject({
      x: 1,
    });
    const down = moveTileBy([], widgets, grid, 'a', 'down', 'expanded');
    expect(at(down, 'd')).toMatchObject({ y: 0 });
    expect(at(down, 'a')?.y).toBeGreaterThanOrEqual(3);
    expect(at(moveTileBy([], widgets, grid, 'd', 'up', 'expanded'), 'd')).toMatchObject({ y: 0 });
  });

  it('swaps with its neighbour in the reading order when the grid flows', () => {
    const next = moveTileBy([], widgets, grid, 'a', 'right', 'medium');
    expect(keys(resolveTiles(next, widgets, grid))).toEqual(['b', 'a', 'c', 'd']);
    const previous = moveTileBy([], widgets, grid, 'c', 'up', 'compact');
    expect(keys(resolveTiles(previous, widgets, grid))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('stays put at an edge', () => {
    const before = materializeLayout([], widgets, grid);
    expect(layoutsEqual(moveTileBy([], widgets, grid, 'a', 'left', 'expanded'), before)).toBe(true);
    expect(layoutsEqual(moveTileBy([], widgets, grid, 'a', 'up', 'expanded'), before)).toBe(true);
  });
});

describe('resizeTile', () => {
  it('sets a place and a size from any edge, within the widget and the columns', () => {
    const c = at(resizeTile([], widgets, grid, 'c', { x: 4, y: 0, w: 8, h: 4 }), 'c');
    expect([c?.x, c?.w, c?.h]).toEqual([4, 8, 4]);
    const clamped = at(resizeTile([], widgets, grid, 'c', { x: 0, y: 0, w: 12, h: 9 }), 'c');
    expect([clamped?.w, clamped?.h]).toEqual([8, 4]);
  });

  it('leaves a widget that names no minimum two columns by two rows', () => {
    const a = at(resizeTile([], widgets, grid, 'a', { x: 0, y: 0, w: 1, h: 1 }), 'a');
    expect([a?.w, a?.h]).toEqual([2, 2]);
    const narrow = { expanded: 1, medium: 1, compact: 1 };
    const [one] = resolveTiles([], widgets.slice(0, 1), narrow);
    expect(one?.minColumns).toBe(1);
  });

  it('pushes what the new size covers below it', () => {
    const grown = resizeTile([], widgets, grid, 'a', { x: 0, y: 0, w: 5, h: 2 });
    expect(at(grown, 'b')?.y).toBeGreaterThanOrEqual(2);
  });
});

describe('resizeTileBy', () => {
  it('steps the end edge, and grows toward the start at the last column', () => {
    const wider = resizeTileBy([], widgets, grid, 'a', { columns: 1, rows: 1 }, 'expanded');
    expect(at(wider, 'a')).toMatchObject({ w: 4, h: 3 });
    const layout: DashboardLayout = [{ key: 'a', x: 9, y: 0, w: 3, h: 2 }];
    const grown = resizeTileBy(
      layout,
      widgets.slice(0, 1),
      grid,
      'a',
      { columns: 1, rows: 0 },
      'expanded',
    );
    expect(grown[0]).toMatchObject({ x: 8, w: 4 });
  });

  it('steps between a half and the whole in the medium class, and nothing in the compact', () => {
    const whole = resizeTileBy([], widgets, grid, 'a', { columns: 1, rows: 0 }, 'medium');
    expect(at(whole, 'a')?.w).toBe(12);
    const half = resizeTileBy(whole, widgets, grid, 'a', { columns: -1, rows: 0 }, 'medium');
    expect(at(half, 'a')?.w).toBe(6);
    const before = materializeLayout([], widgets, grid);
    const compact = resizeTileBy([], widgets, grid, 'a', { columns: 1, rows: 1 }, 'compact');
    expect(layoutsEqual(compact, before)).toBe(true);
  });
});

describe('setTileHidden', () => {
  it('hides a widget, lets the others close the gap, and shows it where it was', () => {
    const hidden = setTileHidden([], widgets, grid, 'a', true);
    expect(keys(resolveTiles(hidden, widgets, grid))).toEqual(['b', 'c', 'd']);
    const shown = setTileHidden(hidden, widgets, grid, 'a', false);
    expect(at(shown, 'a')).toMatchObject({ x: 0, y: 0 });
  });
});

describe('cellAt', () => {
  it('reads the cell under a point, mirrored in right-to-left', () => {
    const box = { left: 0, top: 0, width: 1210 };
    const geometry = { columns: 12, row: 72, gap: 10 };
    expect(cellAt({ x: 5, y: 5 }, box, geometry, 'ltr')).toEqual({ x: 0, y: 0 });
    expect(cellAt({ x: 250, y: 90 }, box, geometry, 'ltr')).toEqual({ x: 2, y: 1 });
    expect(cellAt({ x: 5, y: 5 }, box, geometry, 'rtl')).toEqual({ x: 11, y: 0 });
  });
});

describe('spanFromTravel', () => {
  it('rounds a travel to whole tracks', () => {
    const base = { span: 3, track: 100, gap: 10 };
    expect(spanFromTravel({ ...base, travel: 120 })).toBe(4);
    expect(spanFromTravel({ ...base, travel: -400 })).toBe(1);
  });
});

/**
 * A widget sized by its content draws as many rows as its content measures,
 * within its limits, and the widgets below make room. The stored height stays
 * the minimum the reader set: a layout the family hands back never holds the
 * measured rows.
 */
describe('a widget sized by its content', () => {
  const grid = resolveColumns(12);
  const layout = [
    { key: 'list', x: 0, y: 0, w: 6, h: 2 },
    { key: 'below', x: 0, y: 2, w: 6, h: 2 },
  ];

  const S = DASHBOARD_SUBROWS;
  const picture = (tiles: readonly DashboardTile[]) =>
    tiles.map(({ key, y, h, top, span }) => ({ key, y, h, top, span }));

  it('draws a taller content at its height, in rows for moves and in sub-rows for the picture', () => {
    const widgets = [{ key: 'list', contentSpan: 3 * S + 5 }, { key: 'below' }];
    expect(picture(resolveTiles(layout, widgets, grid))).toEqual([
      { key: 'list', y: 0, h: 4, top: 0, span: 3 * S + 5 },
      { key: 'below', y: 4, h: 2, top: 3 * S + 5, span: 2 * S },
    ]);
    expect(materializeLayout(layout, widgets, grid).map(({ key, h }) => ({ key, h }))).toEqual([
      { key: 'list', h: 2 },
      { key: 'below', h: 2 },
    ]);
  });

  it('draws a shorter content at its height, and what is below rises to it', () => {
    const widgets = [{ key: 'list', contentSpan: S + 3 }, { key: 'below' }];
    expect(picture(resolveTiles(layout, widgets, grid))).toEqual([
      { key: 'list', y: 0, h: 2, top: 0, span: S + 3 },
      { key: 'below', y: 2, h: 2, top: S + 3, span: 2 * S },
    ]);
  });

  it('floors the picture at minRows only when the widget states it, and caps it at maxRows', () => {
    const span = (spec: DashboardWidgetSpec) => resolveTiles(layout, [spec], grid)[0]?.span;
    expect(span({ key: 'list', contentSpan: 4 })).toBe(4);
    expect(span({ key: 'list', contentSpan: 4, minRows: 2 })).toBe(2 * S);
    expect(span({ key: 'list', contentSpan: 9 * S, maxRows: 5 })).toBe(5 * S);
    expect(
      resolveTiles(layout, [{ key: 'list', contentSpan: 9 * S, maxRows: 5 }], grid)[0]?.h,
    ).toBe(5);
  });
});

describe('sizeClassOf', () => {
  it('reads the three classes at 600 and 1024 pixels', () => {
    expect(sizeClassOf(599)).toBe('compact');
    expect(sizeClassOf(600)).toBe('medium');
    expect(sizeClassOf(1024)).toBe('expanded');
  });

  it('moves the expanded threshold to expandedFrom', () => {
    expect(sizeClassOf(970)).toBe('medium');
    expect(sizeClassOf(970, 900)).toBe('expanded');
    expect(sizeClassOf(599, 400)).toBe('compact');
  });
});

describe('serializeDashboardLayout and parseDashboardLayout', () => {
  it('round-trips a layout', () => {
    const layout: DashboardLayout = [
      { key: 'a', x: 0, y: 0, w: 3, h: 2 },
      { key: 'b x', x: 3, y: 0, w: 6, h: 4, hidden: true },
    ];
    expect(parseDashboardLayout(serializeDashboardLayout(layout))).toEqual(layout);
  });

  it('answers null for text it cannot read, and drops an entry it cannot read', () => {
    for (const text of ['', 'nope', '{"v":2}', '{"v":1,"items":[]}', '[]']) {
      expect(parseDashboardLayout(text)).toBeNull();
    }
    expect(
      parseDashboardLayout('{"v":2,"items":[["a",0,0,3,2],["b",-1,0,2,2],["c",0,1,0,2]]}'),
    ).toEqual([{ key: 'a', x: 0, y: 0, w: 3, h: 2 }]);
  });
});

describe('layoutsEqual', () => {
  it('compares places, sizes and hidden', () => {
    const a: DashboardLayout = [{ key: 'a', x: 0, y: 0, w: 3, h: 2 }];
    expect(layoutsEqual(a, [{ key: 'a', x: 0, y: 0, w: 3, h: 2, hidden: false }])).toBe(true);
    expect(layoutsEqual(a, [{ key: 'a', x: 1, y: 0, w: 3, h: 2 }])).toBe(false);
  });
});

describe('dashboardKeyIntent', () => {
  const key = (
    name: string,
    mods: Partial<Record<'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey', boolean>> = {},
  ) => ({ key: name, altKey: false, shiftKey: false, ctrlKey: false, metaKey: false, ...mods });

  it('moves on Alt and an arrow, mirrored in right-to-left', () => {
    expect(dashboardKeyIntent(key('ArrowRight', { altKey: true }), 'ltr')).toEqual({
      kind: 'move',
      direction: 'right',
    });
    expect(dashboardKeyIntent(key('ArrowRight', { altKey: true }), 'rtl')).toEqual({
      kind: 'move',
      direction: 'left',
    });
    expect(dashboardKeyIntent(key('ArrowDown', { altKey: true }), 'ltr')).toEqual({
      kind: 'move',
      direction: 'down',
    });
  });

  it('resizes on Shift and an arrow, and hides on Delete', () => {
    expect(dashboardKeyIntent(key('ArrowLeft', { shiftKey: true }), 'rtl')).toEqual({
      kind: 'resize',
      columns: 1,
      rows: 0,
    });
    expect(dashboardKeyIntent(key('Delete'), 'ltr')).toEqual({ kind: 'hide' });
    expect(dashboardKeyIntent(key('ArrowRight'), 'ltr')).toBeNull();
    expect(dashboardKeyIntent(key('Home', { altKey: true }), 'ltr')).toBeNull();
  });
});

describe('parseDuration', () => {
  it('reads milliseconds and seconds', () => {
    expect(parseDuration('200ms')).toBe(200);
    expect(parseDuration(' 0.32s')).toBe(320);
    expect(parseDuration('')).toBe(0);
  });
});

describe('handleShortcuts', () => {
  it('lists Delete only for a widget that can be hidden', () => {
    expect(handleShortcuts(true)).toMatch(/Delete$/);
    expect(handleShortcuts(false)).not.toMatch(/Delete/);
  });
});

describe('resizeTileInClass', () => {
  it('takes the box in the expanded class and snaps the width in the medium one', () => {
    const expanded = resizeTileInClass(
      [],
      widgets,
      grid,
      'a',
      { x: 0, y: 0, w: 5, h: 3 },
      'expanded',
    );
    expect(at(expanded, 'a')).toMatchObject({ w: 5, h: 3 });
    const medium = resizeTileInClass([], widgets, grid, 'a', { x: 0, y: 0, w: 4, h: 2 }, 'medium');
    expect(at(medium, 'a')?.w).toBe(6);
  });
});

describe('swapTiles', () => {
  it('exchanges two widgets', () => {
    const swapped = swapTiles([], widgets, grid, 'a', 'b');
    expect(at(swapped, 'a')).toMatchObject({ x: 3, y: 0 });
    expect(at(swapped, 'b')).toMatchObject({ x: 0, y: 0 });
  });
});
