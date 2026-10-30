import { describe, expect, it } from 'vitest';

import { cascadeSelection, createTreeCollection, indeterminateKeys } from './tree';

interface Entry {
  id: string;
  name: string;
  entries?: Entry[];
  /** A branch whose children have not been fetched yet. */
  more?: number;
  locked?: boolean;
}

/**
 *  src            branch, expanded in most tests
 *    index.ts     leaf
 *    lib          branch
 *      a.ts       leaf
 *      b.ts       leaf, disabled
 *  docs           branch with three children nobody has fetched
 *  readme.md      leaf
 */
const roots: Entry[] = [
  {
    id: 'src',
    name: 'src',
    entries: [
      { id: 'index.ts', name: 'index.ts' },
      {
        id: 'lib',
        name: 'lib',
        entries: [
          { id: 'a.ts', name: 'a.ts' },
          { id: 'b.ts', name: 'b.ts', locked: true },
        ],
      },
    ],
  },
  { id: 'docs', name: 'docs', more: 3 },
  { id: 'readme.md', name: 'readme.md' },
];

const nested = () =>
  createTreeCollection<Entry>({
    roots,
    getKey: (entry) => entry.id,
    getLabel: (entry) => entry.name,
    getChildren: (entry) => entry.entries,
    hasChildren: (entry) => entry.entries !== undefined || entry.more !== undefined,
    getChildrenCount: (entry) => entry.more,
    isDisabled: (entry) => entry.locked === true,
  });

interface Row {
  id: string;
  name: string;
  level: number;
}

/** The same tree, already flattened, which is what a rowset backend returns. */
const rows: Row[] = [
  { id: 'src', name: 'src', level: 0 },
  { id: 'index.ts', name: 'index.ts', level: 1 },
  { id: 'lib', name: 'lib', level: 1 },
  { id: 'a.ts', name: 'a.ts', level: 2 },
  { id: 'b.ts', name: 'b.ts', level: 2 },
  { id: 'docs', name: 'docs', level: 0 },
  { id: 'readme.md', name: 'readme.md', level: 0 },
];

const flat = () =>
  createTreeCollection<Row>({
    items: rows,
    getKey: (row) => row.id,
    getLabel: (row) => row.name,
    getLevel: (row) => row.level,
  });

const keysOf = (nodes: readonly { key: string }[]) => nodes.map((node) => node.key);

describe('createTreeCollection, nested data', () => {
  it('reads the tree depth first, which is the order the keyboard counts', () => {
    expect(nested().keys).toEqual(['src', 'index.ts', 'lib', 'a.ts', 'b.ts', 'docs', 'readme.md']);
  });

  it('gives every node its level, its parent and its children', () => {
    const collection = nested();
    expect(collection.nodeFor('lib')?.level).toBe(1);
    expect(collection.nodeFor('lib')?.parent).toBe('src');
    expect(collection.nodeFor('lib')?.children).toEqual(['a.ts', 'b.ts']);
    expect(collection.nodeFor('src')?.parent).toBeUndefined();
    expect(collection.roots).toEqual(['src', 'docs', 'readme.md']);
  });

  it('counts a node among its siblings, which is what aria-posinset reports', () => {
    const collection = nested();
    expect(collection.nodeFor('lib')?.posInSet).toBe(2);
    expect(collection.nodeFor('lib')?.setSize).toBe(2);
    expect(collection.nodeFor('readme.md')?.posInSet).toBe(3);
  });

  /**
   * A branch nobody has fetched is a branch, and it says how large it will be.
   * Without this the family cannot draw a placeholder of the right height and
   * cannot write `aria-setsize` for children that have not arrived.
   */
  it('holds a branch whose children have not been fetched', () => {
    const collection = nested();
    const docs = collection.nodeFor('docs');
    expect(docs?.hasChildren).toBe(true);
    expect(docs?.children).toEqual([]);
    expect(docs?.childrenCount).toBe(3);
    expect(collection.nodeFor('readme.md')?.hasChildren).toBe(false);
  });

  it('names the disabled nodes without removing them from the order', () => {
    const collection = nested();
    expect(collection.isDisabled('b.ts')).toBe(true);
    expect(collection.isDisabled('a.ts')).toBe(false);
    expect(collection.keys).toContain('b.ts');
  });

  it('falls back to the key when no label is read', () => {
    const collection = createTreeCollection<Entry>({ roots, getKey: (entry) => entry.id });
    expect(collection.nodeFor('src')?.label).toBe('src');
  });
});

describe('createTreeCollection, flat data with a level column', () => {
  it('rebuilds the same hierarchy the nested shape produces', () => {
    const collection = flat();
    expect(collection.keys).toEqual(nested().keys);
    expect(collection.nodeFor('a.ts')?.parent).toBe('lib');
    expect(collection.nodeFor('lib')?.children).toEqual(['a.ts', 'b.ts']);
    expect(collection.roots).toEqual(['src', 'docs', 'readme.md']);
  });

  /**
   * A level that jumps two steps has no parent at the level it claims. It is
   * attached to the deepest open ancestor rather than dropped, because a row
   * the consumer sent and the tree does not render is a row nobody can debug.
   */
  it('attaches a row whose level skips a step to the nearest ancestor', () => {
    const collection = createTreeCollection<Row>({
      items: [
        { id: 'a', name: 'a', level: 0 },
        { id: 'b', name: 'b', level: 3 },
      ],
      getKey: (row) => row.id,
      getLevel: (row) => row.level,
    });
    expect(collection.nodeFor('b')?.parent).toBe('a');
    expect(collection.nodeFor('b')?.level).toBe(1);
  });
});

describe('visible', () => {
  it('holds only the roots while nothing is expanded', () => {
    expect(keysOf(nested().visible([]))).toEqual(['src', 'docs', 'readme.md']);
  });

  it('opens one level at a time', () => {
    expect(keysOf(nested().visible(['src']))).toEqual([
      'src',
      'index.ts',
      'lib',
      'docs',
      'readme.md',
    ]);
  });

  /**
   * An expanded branch inside a collapsed one shows nothing. Expanding a
   * grandchild and then collapsing its grandparent is how a reader produces
   * this, and a flattener that reads the set without the path renders orphans.
   */
  it('refuses a node whose ancestor is closed, however the set was reached', () => {
    expect(keysOf(nested().visible(['lib']))).toEqual(['src', 'docs', 'readme.md']);
    expect(keysOf(nested().visible(['src', 'lib']))).toEqual([
      'src',
      'index.ts',
      'lib',
      'a.ts',
      'b.ts',
      'docs',
      'readme.md',
    ]);
  });

  it('ignores a key the collection does not hold', () => {
    expect(keysOf(nested().visible(['src', 'gone']))).toEqual([
      'src',
      'index.ts',
      'lib',
      'docs',
      'readme.md',
    ]);
  });
});

describe('descendantsOf, ancestorsOf and siblingsOf', () => {
  it('reads every descendant, however deep, in the tree order', () => {
    expect(nested().descendantsOf('src')).toEqual(['index.ts', 'lib', 'a.ts', 'b.ts']);
    expect(nested().descendantsOf('a.ts')).toEqual([]);
  });

  it('reads the ancestors root first, which is the order a path is opened in', () => {
    expect(nested().ancestorsOf('a.ts')).toEqual(['src', 'lib']);
    expect(nested().ancestorsOf('src')).toEqual([]);
  });

  it('reads the siblings, which is what the asterisk expands', () => {
    expect(nested().siblingsOf('index.ts')).toEqual(['index.ts', 'lib']);
    expect(nested().siblingsOf('src')).toEqual(['src', 'docs', 'readme.md']);
  });

  it('names the branches, which is what expand-all opens', () => {
    expect(nested().branchKeys).toEqual(['src', 'lib', 'docs']);
  });
});

describe('cascadeSelection', () => {
  it('selects a branch and every enabled descendant under it', () => {
    const result = cascadeSelection({
      collection: nested(),
      selected: [],
      key: 'lib',
      action: 'toggle',
    });
    expect(result.selected).toEqual(['lib', 'a.ts']);
    expect(result.changed).toBe(true);
  });

  it('leaves a disabled descendant alone in both directions', () => {
    const collection = nested();
    const on = cascadeSelection({ collection, selected: [], key: 'src', action: 'toggle' });
    expect(on.selected).not.toContain('b.ts');
    const off = cascadeSelection({
      collection,
      selected: [...on.selected, 'b.ts'],
      key: 'src',
      action: 'toggle',
    });
    expect(off.selected).toEqual(['b.ts']);
  });

  /**
   * A parent is selected exactly when every enabled child is. Selecting the one
   * enabled child of `lib` therefore selects `lib`, and `src` follows when its
   * own children are all selected.
   */
  it('rolls the parent up when its last enabled child is selected', () => {
    const result = cascadeSelection({
      collection: nested(),
      selected: [],
      key: 'a.ts',
      action: 'toggle',
    });
    expect(result.selected).toEqual(['lib', 'a.ts']);
  });

  it('rolls the parent back down when one child leaves', () => {
    const collection = nested();
    const all = cascadeSelection({ collection, selected: [], key: 'src', action: 'toggle' });
    expect(all.selected).toEqual(['src', 'index.ts', 'lib', 'a.ts']);
    const less = cascadeSelection({
      collection,
      selected: all.selected,
      key: 'a.ts',
      action: 'toggle',
    });
    expect(less.selected).toEqual(['index.ts']);
  });

  /**
   * A branch nobody has fetched has no children to roll up from, so it is a
   * leaf for the rollup and stays selected on its own.
   */
  it('treats an unfetched branch as a leaf', () => {
    const result = cascadeSelection({
      collection: nested(),
      selected: [],
      key: 'docs',
      action: 'toggle',
    });
    expect(result.selected).toEqual(['docs']);
  });

  it('keeps a key the collection no longer holds', () => {
    const result = cascadeSelection({
      collection: nested(),
      selected: ['gone'],
      key: 'readme.md',
      action: 'toggle',
    });
    expect(result.selected).toEqual(['readme.md', 'gone']);
  });

  it('emits nothing when a request changes nothing', () => {
    const collection = nested();
    const result = cascadeSelection({
      collection,
      selected: [],
      key: 'b.ts',
      action: 'toggle',
    });
    expect(result.changed).toBe(false);
    expect(result.selected).toEqual([]);
  });

  it('takes an explicit direction, which is what a checkbox press sends', () => {
    const collection = nested();
    expect(
      cascadeSelection({ collection, selected: ['readme.md'], key: 'readme.md', action: 'select' })
        .changed,
    ).toBe(false);
    expect(
      cascadeSelection({
        collection,
        selected: ['readme.md'],
        key: 'readme.md',
        action: 'deselect',
      }).selected,
    ).toEqual([]);
  });
});

describe('indeterminateKeys', () => {
  it('names a branch holding some of its descendants and not all', () => {
    expect(indeterminateKeys(nested(), ['index.ts'])).toEqual(['src']);
  });

  it('names every ancestor of a partial selection', () => {
    expect(indeterminateKeys(nested(), ['a.ts'])).toEqual(['src', 'lib']);
  });

  it('names nothing when a branch is selected whole', () => {
    expect(indeterminateKeys(nested(), ['src', 'index.ts', 'lib', 'a.ts'])).toEqual([]);
  });

  it('names nothing for a leaf', () => {
    expect(indeterminateKeys(nested(), ['readme.md'])).toEqual([]);
  });
});

describe('a hostile shape', () => {
  it('keeps the first node carrying a key and drops the second', () => {
    const collection = createTreeCollection<Entry>({
      roots: [
        { id: 'a', name: 'first' },
        { id: 'a', name: 'second' },
      ],
      getKey: (entry) => entry.id,
      getLabel: (entry) => entry.name,
    });
    expect(collection.nodeFor('a')?.label).toBe('first');
    expect(collection.keys).toEqual(['a']);
  });

  /**
   * `getChildren` reaching back to an ancestor is a cycle, and a depth-first
   * walk over one does not return. The walk descends into a key once.
   */
  it('descends into a key once, so a cycle terminates', () => {
    const parent: Entry = { id: 'a', name: 'a' };
    const child: Entry = { id: 'b', name: 'b', entries: [parent] };
    parent.entries = [child];
    const collection = createTreeCollection<Entry>({
      roots: [parent],
      getKey: (entry) => entry.id,
      getChildren: (entry) => entry.entries,
    });
    expect(collection.keys).toEqual(['a', 'b']);
  });

  it('holds nothing without failing', () => {
    const collection = createTreeCollection<Entry>({ roots: [], getKey: (entry) => entry.id });
    expect(collection.keys).toEqual([]);
    expect(collection.visible([])).toEqual([]);
    expect(indeterminateKeys(collection, [])).toEqual([]);
  });
});
