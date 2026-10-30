import { describe, expect, it } from 'vitest';

import { createCollection } from './items';

interface Fruit {
  id: string;
  name: string;
  sold?: boolean;
}

const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'banana', name: 'Banana', sold: true },
  { id: 'cherry', name: 'Cherry' },
];

const flat = () =>
  createCollection<Fruit>({
    items: fruit,
    getKey: (item) => item.id,
    getLabel: (item) => item.name,
    isDisabled: (item) => item.sold === true,
  });

const grouped = () =>
  createCollection<Fruit>({
    sections: [
      { key: 'pome', label: 'Pome', items: [fruit[0] as Fruit] },
      { key: 'berry', label: 'Berry', items: [fruit[1] as Fruit, fruit[2] as Fruit] },
    ],
    getKey: (item) => item.id,
    getLabel: (item) => item.name,
    isDisabled: (item) => item.sold === true,
  });

describe('createCollection, a flat collection', () => {
  it('keys every option and answers with the index the keyboard counts', () => {
    const collection = flat();
    expect(collection.keys).toEqual(['apple', 'banana', 'cherry']);
    expect(collection.indexOf('cherry')).toBe(2);
    expect(collection.keyAt(1)).toBe('banana');
    expect(collection.indexOf('durian')).toBe(-1);
    expect(collection.keyAt(9)).toBeUndefined();
  });

  it('reads the labels typeahead matches against', () => {
    expect(flat().labels).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('falls back to the key when no label is stated', () => {
    const collection = createCollection<Fruit>({ items: fruit, getKey: (item) => item.id });
    expect(collection.labels).toEqual(['apple', 'banana', 'cherry']);
  });

  it('holds the disabled set the navigation asks about', () => {
    const collection = flat();
    expect(collection.isDisabled('banana')).toBe(true);
    expect(collection.isDisabled('apple')).toBe(false);
    expect(collection.isDisabled('durian')).toBe(false);
  });

  it('numbers the rows and the options the same way when there are no sections', () => {
    const collection = flat();
    expect(collection.rows).toHaveLength(3);
    for (const [index, row] of collection.rows.entries()) {
      expect(row.kind).toBe('option');
      expect(row.row).toBe(index);
    }
    expect(collection.options.map((option) => option.row)).toEqual([0, 1, 2]);
  });
});

describe('createCollection, a grouped collection', () => {
  /**
   * The two index spaces are the whole reason this module exists: a window
   * counts rows and a keyboard counts options, and a grouped list has more of
   * the first than of the second.
   */
  it('counts labels as rows and not as options', () => {
    const collection = grouped();
    expect(collection.rows).toHaveLength(5);
    expect(collection.options).toHaveLength(3);
    expect(collection.rows.map((row) => row.kind)).toEqual([
      'section-label',
      'option',
      'section-label',
      'option',
      'option',
    ]);
  });

  it('gives every option both of its numbers', () => {
    const collection = grouped();
    expect(collection.options.map((option) => option.index)).toEqual([0, 1, 2]);
    expect(collection.options.map((option) => option.row)).toEqual([1, 3, 4]);
  });

  it('says which section each option belongs to, and which options each section holds', () => {
    const collection = grouped();
    expect(collection.options.map((option) => option.section)).toEqual(['pome', 'berry', 'berry']);
    expect(collection.sections).toEqual([
      { key: 'pome', label: 'Pome', row: 0, firstIndex: 0, lastIndex: 0 },
      { key: 'berry', label: 'Berry', row: 2, firstIndex: 1, lastIndex: 2 },
    ]);
  });

  it('records a section that holds nothing rather than dropping it', () => {
    const collection = createCollection<Fruit>({
      sections: [{ key: 'empty', label: 'Empty', items: [] }],
      getKey: (item) => item.id,
    });
    expect(collection.sections[0]).toMatchObject({ firstIndex: -1, lastIndex: -1 });
    expect(collection.options).toHaveLength(0);
  });
});

describe('createCollection, the set the reader is told about', () => {
  /**
   * The Listbox pattern requires `aria-setsize` and `aria-posinset` exactly
   * when the complete set is not in the DOM, which is what incremental loading
   * produces on every page but the last.
   */
  it('reports the whole set when only part of it has been loaded', () => {
    const collection = createCollection<Fruit>({
      items: fruit,
      getKey: (item) => item.id,
      totalCount: 400,
    });
    expect(collection.setSize).toBe(400);
    expect(collection.partial).toBe(true);
    expect(collection.posInSet('cherry')).toBe(3);
  });

  it('reports what it holds when the whole set is loaded', () => {
    const collection = flat();
    expect(collection.setSize).toBe(3);
    expect(collection.partial).toBe(false);
  });

  it('ignores a total smaller than what it holds, rather than lying about the set', () => {
    const collection = createCollection<Fruit>({
      items: fruit,
      getKey: (item) => item.id,
      totalCount: 1,
    });
    expect(collection.setSize).toBe(3);
    expect(collection.partial).toBe(false);
  });

  it('answers a key it does not hold with -1 rather than with a position', () => {
    expect(flat().posInSet('durian')).toBe(-1);
  });
});

describe('createCollection, hostile input', () => {
  /**
   * A duplicate key comes from a consumer's data rather than from a demo, and
   * the failure it produces — two options that select each other — is invisible
   * until it happens in production. The first option keeps the key.
   */
  it('gives a duplicate key to the first option that claimed it', () => {
    const collection = createCollection<Fruit>({
      items: [fruit[0] as Fruit, { id: 'apple', name: 'Apple again' }],
      getKey: (item) => item.id,
      getLabel: (item) => item.name,
    });
    expect(collection.indexOf('apple')).toBe(0);
    expect(collection.optionFor('apple')?.label).toBe('Apple');
    expect(collection.options).toHaveLength(2);
  });

  it('holds an empty collection without answering anything wrongly', () => {
    const collection = createCollection<Fruit>({ items: [], getKey: (item) => item.id });
    expect(collection.keys).toEqual([]);
    expect(collection.setSize).toBe(0);
    expect(collection.indexOf('apple')).toBe(-1);
    expect(collection.optionAt(0)).toBeUndefined();
  });
});
