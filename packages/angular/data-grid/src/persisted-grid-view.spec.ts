import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { GridColumn, GridDensity } from '@slotted/core/grid';
import { describe, expect, it } from 'vitest';

import { SlDataGrid } from './data-grid';
import { persistedGridView, type GridViewStorage } from './persisted-grid-view';

interface Item {
  id: string;
  name: string;
  size: number;
}

const COLUMNS: GridColumn<Item>[] = [
  { id: 'id', label: 'Id', width: 80 },
  { id: 'name', label: 'Name', width: 160 },
  { id: 'size', label: 'Size', kind: 'number', width: 100 },
];
const ROWS: Item[] = [
  { id: 'a', name: 'Anvil', size: 3 },
  { id: 'b', name: 'Bolt', size: 1 },
  { id: 'c', name: 'Crate', size: 2 },
];

function memoryStorage(initial: Record<string, string> = {}): GridViewStorage & {
  readonly entries: Map<string, string>;
} {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
  };
}

const STORAGE = signal<GridViewStorage | null>(null);
const DEFAULT_DENSITY = signal<GridDensity | null>(null);

@Component({
  standalone: true,
  imports: [SlDataGrid],
  template: `
    <button type="button" (click)="view.reset()">reset</button>
    <sl-data-grid
      aria-label="Items"
      rowKey="id"
      [rows]="rows"
      [columns]="columns"
      [(query)]="view.query"
      [(columnState)]="view.columnState"
      [density]="view.density()"
    />
  `,
})
class Host {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  readonly view = persistedGridView({
    key: 'items',
    columns: COLUMNS,
    storage: STORAGE(),
    defaultQuery: { sort: [], filter: null, search: '', page: { index: 0, size: 2 }, group: [] },
    defaultDensity: DEFAULT_DENSITY(),
  });
}

async function mount(storage: GridViewStorage | null, defaultDensity: GridDensity | null = null) {
  STORAGE.set(storage);
  DEFAULT_DENSITY.set(defaultDensity);
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
  const header = (column: string) =>
    root.querySelector<HTMLElement>(`[data-part="column-header"][data-column="${column}"]`)!;
  return { fixture, root, header };
}

describe('persistedGridView', () => {
  it('writes the view after a change, and reads it back on the next mount', async () => {
    const storage = memoryStorage();
    const first = await mount(storage);
    expect(storage.entries.size).toBe(0);
    first.header('size').click();
    first.fixture.detectChanges();
    expect(storage.entries.get('items')).toBe('sort=size%3Aasc&size=2&v=1');
    first.fixture.componentInstance.view.columnState.update((state) => ({
      ...state,
      hidden: ['size'],
    }));
    first.fixture.detectChanges();
    expect(storage.entries.get('items')).toBe('sort=size%3Aasc&size=2&columns=h%3Dsize&v=1');
    first.fixture.destroy();
    TestBed.resetTestingModule();

    const second = await mount(storage);
    expect(second.root.querySelector('[data-column="size"]')).toBeNull();
    expect(second.root.getAttribute('aria-colcount')).toBe('2');
  });

  it('drops a saved column the model no longer has, and keeps the default page when the entry has none', async () => {
    const storage = memoryStorage({
      items: 'sort=size%3Adesc&columns=h%3Dsize%2Cgone%3Bw%3Dgone%3A30',
    });
    const { root } = await mount(storage);
    expect(root.getAttribute('aria-colcount')).toBe('2');
    expect(root.querySelectorAll('[data-part="body"] > [data-part="row"]')).toHaveLength(2);
  });

  it('resets to the defaults and removes the entry', async () => {
    const storage = memoryStorage({ items: 'sort=size%3Adesc&size=2' });
    const { fixture, header } = await mount(storage);
    expect(header('size').getAttribute('aria-sort')).toBe('descending');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(header('size').hasAttribute('aria-sort')).toBe(false);
    expect(storage.entries.has('items')).toBe(false);
  });

  it('lives in memory when the store throws', async () => {
    const throwing: GridViewStorage = {
      getItem: () => {
        throw new Error('refused');
      },
      setItem: () => {
        throw new Error('refused');
      },
      removeItem: () => undefined,
    };
    const { fixture, header } = await mount(throwing);
    header('size').click();
    fixture.detectChanges();
    expect(header('size').getAttribute('aria-sort')).toBe('ascending');
  });

  it('keeps the density with the view, and reset restores the default density', async () => {
    const storage = memoryStorage({ items: 'density=dense&v=1' });
    const { fixture, root } = await mount(storage, 'compact');
    const view = fixture.componentInstance.view;
    expect(view.density()).toBe('dense');
    expect(root.getAttribute('data-slotted-density')).toBe('dense');
    view.density.set('comfortable');
    fixture.detectChanges();
    expect(storage.entries.get('items')).toBe('size=2&density=comfortable&v=1');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(view.density()).toBe('compact');
    expect(root.getAttribute('data-slotted-density')).toBe('compact');
    expect(storage.entries.has('items')).toBe(false);
  });
});
