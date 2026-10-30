import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { withFilter, withPageIndex, withSearch } from '@slotted/core/grid';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { CategoriesStore } from './categories.store';
import { ProductsStore } from './products.store';
import { SkusStore } from './skus.store';

describe('the catalogue listings', () => {
  let products: ProductsStore;
  let skus: SkusStore;
  let categories: CategoriesStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    categories = TestBed.inject(CategoriesStore);
    products = TestBed.inject(ProductsStore);
    skus = TestBed.inject(SkusStore);
    await categories.reload();
  });

  it('the products list counts the whole catalogue before anything narrows it', async () => {
    await products.openIn(null);

    expect(products.total()).toBe(2400);
    expect(products.grandTotal()).toBe(2400);
    expect(products.rows().length).toBe(25);
  });

  /**
   * BR-01 and BR-02: a branch is a place, and a place is the branch and
   * everything under it — a query narrowed to the branch alone would answer
   * zero, because the seed files every product on a leaf.
   */
  it('a place holds what is under it, not only what is filed on it', async () => {
    const branch = categories.roots().find((node) => node.children.length > 0)!;
    await products.openIn(branch.id);

    expect(products.categoryId()).toBe(branch.id);
    expect(products.total()).toBe(branch.treeCount);
    expect(products.total()).toBeGreaterThan(branch.ownCount);
    expect(products.categoriesUnder()).toBe(branch.subtree.length - 1);
  });

  it('the count of a narrowed place is the place’s, not the tenant’s', async () => {
    const branch = categories.roots().find((node) => node.children.length > 0)!;
    await products.openIn(branch.id);

    expect(products.grandTotal()).toBe(branch.treeCount);
    expect(products.grandTotal()).toBeLessThan(2400);
  });

  it('a place that no longer exists opens the whole catalogue', async () => {
    await products.openIn('cat_does_not_exist');
    expect(products.categoryId()).toBeNull();
    expect(products.total()).toBe(2400);
  });

  it('a search narrows the query and leaves the place’s count where it was', async () => {
    const branch = categories.roots().find((node) => node.children.length > 0)!;
    await products.openIn(branch.id);
    const place = products.grandTotal();

    await products.setSearch('servo');

    expect(products.total()).toBeLessThan(place!);
    expect(products.grandTotal()).toBe(place);
  });

  /** LP-06: a different query empties the rows; the same query read back keeps them. */
  it('empties the rows on a different query and keeps them on a read-back', async () => {
    await products.openIn(null);
    expect(products.rows().length).toBe(25);

    const next = withPageIndex(products.query(), 1).query;
    const pending = products.load(next);
    expect(products.rows()).toEqual([]);
    await pending;
    expect(products.rows().length).toBe(25);

    const again = products.reload();
    expect(products.rows().length).toBe(25);
    await again;
  });

  it('the SKU list answers the question the product list cannot', async () => {
    await skus.openIn(null);
    const all = skus.total()!;

    await skus.setFilter(
      withFilter(skus.query(), {
        join: 'and',
        rules: [
          {
            field: 'belowReorderPoint',
            filter: { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] },
          },
        ],
      }).query.filter,
    );

    expect(skus.total()).toBeGreaterThan(0);
    expect(skus.total()).toBeLessThan(all);
    for (const row of skus.rows()) expect(row.belowReorderPoint).toBe(true);
  });

  it('a money filter is typed in the reader’s unit and travels in minor units', async () => {
    await skus.openIn(null);
    await skus.setFilter({
      join: 'and',
      rules: [
        {
          field: 'listPrice',
          filter: {
            kind: 'number',
            join: 'and',
            conditions: [{ operator: 'greaterThanOrEqual', value: 1000 }],
          },
        },
      ],
    });

    expect(skus.rows().length).toBeGreaterThan(0);
    for (const row of skus.rows()) expect(row.listPrice!.minor).toBeGreaterThanOrEqual(100_000);
  });

  it('the SKU list takes a place the same way the product list does', async () => {
    const branch = categories.roots().find((node) => node.children.length > 0)!;
    await skus.openIn(branch.id);
    const inPlace = skus.total()!;

    await skus.openIn(null);

    expect(inPlace).toBeGreaterThan(0);
    expect(skus.total()).toBeGreaterThan(inPlace);
  });

  it('a search of one character is no search yet', async () => {
    await products.openIn(null);
    await products.load(withSearch(products.query(), 'a').query);
    expect(products.total()).toBe(2400);
  });
});
