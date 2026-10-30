import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { PriceListsStore } from './price-lists.store';

describe('PriceListsStore', () => {
  let store: PriceListsStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    store = TestBed.inject(PriceListsStore);
    store.clearLookup();
    await store.reload();
  });

  it('reads every list with the count of what it holds', () => {
    expect(store.lists().length).toBe(7);
    expect(store.entryTotal()).toBeGreaterThan(0);
    expect(store.currencies()).toContain('USD');
    expect(store.currencies()).toContain('BRL');
  });

  it('a one-character query is no search yet', async () => {
    await store.search('A');
    expect(store.matches()).toEqual([]);
    expect(store.searching()).toBe(false);
  });

  it('finds a SKU by its code', async () => {
    await store.search('AST-SEN');
    expect(store.matches().length).toBeGreaterThan(0);
    expect(store.matches()[0]!.sku).toContain('AST-SEN');
  });

  /**
   * The screen exists because no endpoint lists the entries of a list. What it
   * can do is the other axis: one SKU against every list, with the lists that
   * hold no entry for it named rather than left out.
   */
  it('reads one SKU against every list, priced or not', async () => {
    await store.search('AST-SEN');
    const first = store.matches()[0]!;
    await store.choose(first.id);

    expect(store.skuPrices().length).toBe(store.lists().length);
    expect(store.pricedCount()).toBeGreaterThan(0);
    for (const row of store.skuPrices()) {
      expect(row.listName.length).toBeGreaterThan(0);
      if (row.unitPrice) expect(row.unitPrice.currency).toBe(row.currency);
    }
  });

  it('a chosen SKU is dropped when the lookup is cleared', async () => {
    await store.search('AST-SEN');
    await store.choose(store.matches()[0]!.id);
    expect(store.chosen()).not.toBeNull();

    store.clearLookup();

    expect(store.chosenId()).toBeNull();
    expect(store.skuPrices()).toEqual([]);
  });

  it('a reader without pricing.view is refused the lists, and the store says so', async () => {
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).load();
    await store.reload();

    expect(store.error()).toContain('pricing.view');
    expect(store.lists()).toEqual([]);
  });
});
