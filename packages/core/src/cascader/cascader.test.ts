import { describe, expect, it } from 'vitest';

import { createTreeCollection } from '../collection';
import {
  cascaderColumns,
  cascaderCrumbs,
  cascaderFit,
  cascaderWindow,
  cascaderKey,
  cascaderLayout,
  cascaderSearch,
  cascaderSelection,
  cascaderValue,
  cascaderView,
  flatToTree,
  pathTo,
} from './cascader';
import type { CascaderKeyInput } from './cascader';

interface Place {
  id: string;
  name: string;
  children?: Place[];
  hasChildren?: boolean;
  disabled?: boolean;
}

const places: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    children: [
      {
        id: 'lis',
        name: 'Lisboa',
        children: [
          { id: 'alf', name: 'Alki' },
          { id: 'bel', name: 'Bellevue' },
        ],
      },
      { id: 'opo', name: 'Porto', children: [{ id: 'rib', name: 'Ribeira' }] },
    ],
  },
  {
    id: 'es',
    name: 'España',
    children: [{ id: 'mad', name: 'Madrid' }],
  },
  { id: 'fr', name: 'France', hasChildren: true },
  { id: 'ad', name: 'Andorra', disabled: true },
];

const collection = createTreeCollection({
  roots: places,
  getKey: (place) => place.id,
  getLabel: (place) => place.name,
  getChildren: (place) => place.children,
  hasChildren: (place) => place.hasChildren === true || (place.children?.length ?? 0) > 0,
  isDisabled: (place) => place.disabled === true,
});

describe('cascaderLayout', () => {
  it('keeps an explicit layout', () => {
    expect(cascaderLayout({ layout: 'tree', available: 100, columnMeasure: 192, inset: 8 })).toBe(
      'tree',
    );
  });

  it('shows columns while two of them fit, and drills below that', () => {
    const measure = { columnMeasure: 192, inset: 8 };
    expect(cascaderLayout({ layout: 'auto', available: 392, ...measure })).toBe('columns');
    expect(cascaderLayout({ layout: 'auto', available: 391, ...measure })).toBe('drill');
  });

  it('drills while nothing has been measured, so the server and the first render agree', () => {
    expect(
      cascaderLayout({ layout: 'auto', available: undefined, columnMeasure: 192, inset: 8 }),
    ).toBe('drill');
  });
});

describe('cascaderFit and cascaderWindow', () => {
  const measure = { columnMeasure: 192, inset: 10 };

  it('holds as many columns as fit, capped by maxColumns, and never none', () => {
    expect(cascaderFit({ available: 1600, maxColumns: 3, ...measure })).toBe(3);
    expect(cascaderFit({ available: 600, maxColumns: 3, ...measure })).toBe(3);
    expect(cascaderFit({ available: 420, maxColumns: 3, ...measure })).toBe(2);
    expect(cascaderFit({ available: 180, maxColumns: 3, ...measure })).toBe(1);
    expect(cascaderFit({ available: undefined, maxColumns: 3, ...measure })).toBe(3);
  });

  it('slides the window to the deepest columns and hands the rest to the breadcrumb', () => {
    const columns = cascaderColumns(collection, ['pt', 'lis', 'bel']);
    const window = cascaderWindow(columns, 2);
    expect(window.hidden.map((column) => column.parent)).toEqual([undefined]);
    expect(window.visible.map((column) => column.parent)).toEqual(['pt', 'lis']);
    expect(cascaderWindow(columns, 5).hidden).toEqual([]);
  });
});

describe('cascaderCrumbs', () => {
  it('lists a short trail whole, the last one current', () => {
    expect(cascaderCrumbs([undefined, 'pt', 'lis'])).toEqual([
      { type: 'level', key: undefined, current: false },
      { type: 'level', key: 'pt', current: false },
      { type: 'level', key: 'lis', current: true },
    ]);
  });

  it('folds the middle of a deep trail into one crumb that goes to its deepest level', () => {
    expect(cascaderCrumbs(['a', 'b', 'c', 'd', 'e', 'f'], 4)).toEqual([
      { type: 'level', key: 'a', current: false },
      { type: 'collapsed', keys: ['b', 'c', 'd'], target: 'd' },
      { type: 'level', key: 'e', current: false },
      { type: 'level', key: 'f', current: true },
    ]);
  });
});

describe('pathTo and cascaderColumns', () => {
  it('names the path to a node, root first', () => {
    expect(pathTo(collection, 'bel')).toEqual(['pt', 'lis', 'bel']);
    expect(pathTo(collection, 'missing')).toEqual([]);
  });

  it('opens one column for the root and one for every branch on the path', () => {
    const columns = cascaderColumns(collection, ['pt', 'lis', 'bel']);
    expect(columns.map((column) => column.parent)).toEqual([undefined, 'pt', 'lis']);
    expect(columns[2]?.keys).toEqual(['alf', 'bel']);
    expect(columns.map((column) => column.level)).toEqual([1, 2, 3]);
  });

  it('stops at the first key that is not a child of the one before it', () => {
    const columns = cascaderColumns(collection, ['pt', 'mad']);
    expect(columns.map((column) => column.parent)).toEqual([undefined, 'pt']);
  });

  it('says a branch whose children have not arrived is waiting for them', () => {
    const columns = cascaderColumns(collection, ['fr']);
    expect(columns[1]).toMatchObject({ parent: 'fr', keys: [], pending: true });
  });
});

describe('flatToTree', () => {
  it('nests a flat list by its parent pointers, keeping the order rows arrived in', () => {
    const rows = [
      { id: 'b', parent: 'a' },
      { id: 'a', parent: null },
      { id: 'c', parent: 'a' },
      { id: 'orphan', parent: 'gone' },
    ];
    const tree = flatToTree(rows, {
      getKey: (row) => row.id,
      getParent: (row) => row.parent,
    });
    expect(tree.roots.map((row) => row.id)).toEqual(['a', 'orphan']);
    expect(tree.getChildren(rows[1] as (typeof rows)[number])?.map((row) => row.id)).toEqual([
      'b',
      'c',
    ]);
  });
});

describe('cascaderKey', () => {
  const base: CascaderKeyInput = {
    key: 'ArrowDown',
    dir: 'ltr',
    layout: 'columns',
    open: true,
    active: 'lis',
    path: ['pt', 'lis'],
    expandedKeys: [],
    collection,
    selectionMode: 'single',
    isSelectable: (key) => (collection.nodeFor(key)?.hasChildren ?? true) === false,
    search: false,
    hasQuery: false,
  };

  it('opens the popup from a closed trigger', () => {
    expect(cascaderKey({ ...base, open: false, key: 'ArrowDown' })).toEqual({
      type: 'open',
      entry: 'first',
    });
    expect(cascaderKey({ ...base, open: false, key: 'ArrowUp' })).toEqual({
      type: 'open',
      entry: 'last',
    });
  });

  it('moves among siblings of the active column in columns and drill', () => {
    expect(cascaderKey(base)).toEqual({ type: 'move', key: 'opo' });
    /* The pattern's tree does not wrap, and neither does a column. */
    expect(cascaderKey({ ...base, key: 'ArrowUp' })).toEqual({ type: 'none' });
    expect(cascaderKey({ ...base, active: 'opo', key: 'Home' })).toEqual({
      type: 'move',
      key: 'lis',
    });
    expect(cascaderKey({ ...base, key: 'End' })).toEqual({ type: 'move', key: 'opo' });
  });

  it('moves to the next visible node in the tree layout', () => {
    const input = { ...base, layout: 'tree' as const, active: 'pt', expandedKeys: ['pt'] };
    expect(cascaderKey(input)).toEqual({ type: 'move', key: 'lis' });
  });

  it('opens a branch and steps into its first child in one step on the inline end', () => {
    expect(cascaderKey({ ...base, key: 'ArrowRight' })).toEqual({
      type: 'enter',
      path: ['pt', 'lis'],
      key: 'alf',
    });
  });

  it('mirrors the inline axis in a right-to-left document', () => {
    expect(cascaderKey({ ...base, key: 'ArrowLeft', dir: 'rtl' })).toEqual({
      type: 'enter',
      path: ['pt', 'lis'],
      key: 'alf',
    });
  });

  it('asks for a level it does not hold, and stays where it is', () => {
    expect(cascaderKey({ ...base, active: 'fr', path: ['fr'], key: 'ArrowRight' })).toEqual({
      type: 'enter',
      path: ['fr'],
      key: undefined,
    });
  });

  it('goes back to the parent and closes the column it left', () => {
    expect(
      cascaderKey({ ...base, active: 'alf', path: ['pt', 'lis', 'alf'], key: 'ArrowLeft' }),
    ).toEqual({ type: 'back', path: ['pt'], key: 'lis' });
    expect(cascaderKey({ ...base, active: 'pt', path: ['pt'], key: 'ArrowLeft' })).toEqual({
      type: 'none',
    });
  });

  it('opens and closes a branch in place in the tree layout', () => {
    const tree = { ...base, layout: 'tree' as const, active: 'pt' };
    expect(cascaderKey({ ...tree, key: 'ArrowRight' })).toEqual({ type: 'expand', key: 'pt' });
    expect(cascaderKey({ ...tree, key: 'ArrowRight', expandedKeys: ['pt'] })).toEqual({
      type: 'move',
      key: 'lis',
    });
    expect(cascaderKey({ ...tree, key: 'ArrowLeft', expandedKeys: ['pt'] })).toEqual({
      type: 'collapse',
      key: 'pt',
    });
  });

  it('commits a selectable node, and enters a branch that is not', () => {
    expect(
      cascaderKey({ ...base, active: 'alf', path: ['pt', 'lis', 'alf'], key: 'Enter' }),
    ).toEqual({ type: 'commit', key: 'alf' });
    expect(cascaderKey({ ...base, key: 'Enter' })).toMatchObject({ type: 'enter' });
  });

  it('refuses a disabled node', () => {
    expect(cascaderKey({ ...base, active: 'ad', path: ['ad'], key: 'Enter' })).toEqual({
      type: 'none',
    });
  });

  it('toggles under multiple selection on Space and on Enter', () => {
    const many = {
      ...base,
      selectionMode: 'multiple' as const,
      active: 'alf',
      path: ['pt', 'lis', 'alf'],
    };
    expect(cascaderKey({ ...many, key: ' ' })).toEqual({ type: 'toggle', key: 'alf' });
    expect(cascaderKey({ ...many, key: 'Enter' })).toEqual({ type: 'toggle', key: 'alf' });
  });

  it('clears a query before it closes', () => {
    expect(cascaderKey({ ...base, key: 'Escape', search: true, hasQuery: true })).toEqual({
      type: 'clear-search',
    });
    expect(cascaderKey({ ...base, key: 'Escape' })).toEqual({ type: 'close' });
  });

  it('leaves the caret keys to a search field', () => {
    expect(cascaderKey({ ...base, key: 'Home', search: true })).toEqual({ type: 'none' });
  });
});

describe('cascaderSearch', () => {
  it('finds a node at any level and hands back its path', () => {
    const results = cascaderSearch({ collection, query: 'bel' });
    expect(results).toEqual([{ key: 'bel', path: ['pt', 'lis', 'bel'], ranges: [[0, 3]] }]);
  });

  it('matches without regard to accents in the reader locale', () => {
    expect(cascaderSearch({ collection, query: 'espana' }).map((hit) => hit.key)).toEqual(['es']);
  });

  it('returns nothing for an empty query', () => {
    expect(cascaderSearch({ collection, query: '' })).toEqual([]);
  });
});

describe('cascaderValue', () => {
  const selected = ['lis', 'alf', 'bel', 'rib', 'opo'];

  it('emits every selected key under all', () => {
    expect(cascaderValue({ collection, selected, strategy: 'all' })).toEqual(selected);
  });

  it('emits a whole branch as its parent alone under parent', () => {
    expect(cascaderValue({ collection, selected, strategy: 'parent' })).toEqual(['lis', 'opo']);
  });

  it('emits only the leaves under child', () => {
    expect(cascaderValue({ collection, selected, strategy: 'child' })).toEqual([
      'alf',
      'bel',
      'rib',
    ]);
  });
});

describe('cascaderView', () => {
  const base = {
    collection,
    layout: 'columns' as const,
    path: ['pt', 'lis'],
    activeKey: 'bel',
    expandedKeys: [],
    query: '',
    selected: ['alf'],
    selectionMode: 'single' as const,
    isSelectable: (key: string) => !(collection.nodeFor(key)?.hasChildren ?? false),
    fit: 3,
    maxCrumbs: 4,
  };

  it('draws the columns of the path with the states of each node', () => {
    const view = cascaderView(base);
    expect(view.columns.map((column) => column.parent)).toEqual([undefined, 'pt', 'lis']);
    const lisboa = view.columns[1]?.nodes.find((node) => node.key === 'lis');
    expect(lisboa).toMatchObject({
      expanded: true,
      branch: true,
      level: 2,
      posInSet: 1,
      setSize: 2,
    });
    const alfama = view.columns[2]?.nodes.find((node) => node.key === 'alf');
    expect(alfama).toMatchObject({ selected: true, selectable: true });
    expect(view.columns[2]?.nodes.find((node) => node.key === 'bel')?.current).toBe(true);
    expect(view.crumbs).toEqual([]);
  });

  it('slides past the levels that do not fit and lists them as crumbs to go back to', () => {
    const view = cascaderView({ ...base, fit: 2 });
    expect(view.columns.map((column) => column.parent)).toEqual(['pt', 'lis']);
    expect(view.crumbs).toEqual([{ type: 'level', key: undefined, current: false }]);
  });

  it('drills one level with the trail behind it, the shown level current', () => {
    const view = cascaderView({ ...base, layout: 'drill' });
    expect(view.columns.map((column) => column.parent)).toEqual(['lis']);
    expect(view.crumbs.map((crumb) => (crumb.type === 'level' ? crumb.current : null))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('counts the selected keys inside a branch and marks it partly chosen', () => {
    const view = cascaderView({ ...base, selectionMode: 'multiple', selected: ['alf'] });
    const lisboa = view.columns[1]?.nodes.find((node) => node.key === 'lis');
    expect(lisboa).toMatchObject({ selectedInside: 1, indeterminate: true });
  });

  it('lists the visible nodes in one run under the tree layout', () => {
    const view = cascaderView({ ...base, layout: 'tree', expandedKeys: ['pt'] });
    expect(view.columns[0]?.nodes.map((node) => [node.key, node.depth])).toEqual([
      ['pt', 0],
      ['lis', 1],
      ['opo', 1],
      ['es', 0],
      ['fr', 0],
      ['ad', 0],
    ]);
  });

  it('answers a query with hits from every level, each with its trail', () => {
    const view = cascaderView({ ...base, query: 'bel' });
    expect(view.searching).toBe(true);
    expect(view.results.map((node) => [node.key, node.trail])).toEqual([['bel', ['pt', 'lis']]]);
  });
});

describe('cascaderSelection', () => {
  it('brings a value under parent back to the set every box reads', () => {
    expect(cascaderSelection(collection, ['lis'])).toEqual(['lis', 'alf', 'bel']);
  });

  it('marks a branch whose children are all chosen, from a value under child', () => {
    expect(cascaderSelection(collection, ['alf', 'bel'])).toEqual(['lis', 'alf', 'bel']);
  });
});
