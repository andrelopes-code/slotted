import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { SessionStore } from '../session/session.store';
import { SkuStore } from './sku.store';

/** The three §82 cases the catalogue is measured by, by their seeded fixture keys. */
const FIXTURES = {
  zeroAvailableInbound: 'edge.sku.zero_available_inbound',
  threeWarehouses: 'edge.sku.three_warehouses',
  discontinued: 'edge.sku.discontinued',
} as const;

describe('SkuStore', () => {
  let store: SkuStore;
  let fixtures: Record<string, string>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    fixtures = api.demo.fixtures();
    store = TestBed.inject(SkuStore);
  });

  async function open(fixture: keyof typeof FIXTURES): Promise<void> {
    await store.open(fixtures[FIXTURES[fixture]]!);
  }

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  it('§82.8 — the positions of a SKU split across warehouses add up to the figures above them', async () => {
    await open('threeWarehouses');
    const item = store.sku()!;

    expect(store.stock().length).toBeGreaterThanOrEqual(3);
    expect(store.stockSum().onHand).toBe(Number(item.onHand));
    expect(store.stockSum().available).toBe(Number(item.available));
    expect(store.stockSum().reserved).toBe(Number(item.reserved));
    expect(store.stockSum().inbound).toBe(Number(item.inbound));
  });

  it('§82.8 — every position names its place rather than its identifier', async () => {
    await open('threeWarehouses');
    for (const row of store.stock()) {
      expect(row.warehouseCode).not.toBe(row.warehouseId);
      expect(row.warehouseCode.length).toBeGreaterThan(0);
    }
  });

  it('§82.7 — nothing available and stock on its way is readable as one fact', async () => {
    await open('zeroAvailableInbound');
    const item = store.sku()!;

    expect(Number(item.available)).toBe(0);
    expect(Number(item.inbound)).toBeGreaterThan(0);
    expect(store.placesWithInbound().length).toBeGreaterThan(0);
    expect(store.placesWithInbound()[0]!.warehouseCode).toMatch(/^[A-Z]/);
  });

  it('§82.6 — a discontinued SKU still reads its stock and its history', async () => {
    await open('discontinued');
    const item = store.sku()!;

    expect(item.status).toBe('discontinued');
    expect(store.stock().length).toBeGreaterThan(0);
    expect(store.stockSum().onHand).toBe(Number(item.onHand));
  });

  /**
   * The trap of this module: `getSku` writes the cost down to zero without
   * `cost.view` and returns no price entry without `pricing.view`. What the
   * store states is whether the reader may be shown them at all.
   */
  it('a representative may be shown the price and never the cost', async () => {
    await signIn('noah-bennett');
    await open('threeWarehouses');

    expect(store.canSeePricing()).toBe(true);
    expect(store.canSeeCost()).toBe(false);
    expect(store.priceEntries().length).toBeGreaterThan(0);
    // The backend still sends a cost, and it is a zero the screen must not draw.
    expect(store.detail()!.sku.standardCost.minor).toBe(0);
    for (const mapping of store.suppliers()) expect(mapping.unitCost.minor).toBe(0);
  });

  it('a warehouse operator is shown neither, and the store reports no entry rather than an empty list', async () => {
    await signIn('jordan-wells');
    await open('threeWarehouses');

    expect(store.canSeePricing()).toBe(false);
    expect(store.canSeeCost()).toBe(false);
    expect(store.priceEntries()).toEqual([]);
    expect(store.detail()!.priceEntries).toEqual([]);
  });

  it('a manager is shown both', async () => {
    await signIn('sofia-ramirez');
    await open('threeWarehouses');

    expect(store.canSeePricing()).toBe(true);
    expect(store.canSeeCost()).toBe(true);
    expect(store.detail()!.sku.standardCost.minor).toBeGreaterThan(0);
  });

  it('a SKU that does not exist is an error the page can class, not a throw', async () => {
    await store.open('sku_does_not_exist');
    expect(store.error()?.code).toBe('NOT_FOUND');
    expect(store.detail()).toBeNull();
  });

  it('each price entry keeps the currency of the list it belongs to', async () => {
    await open('threeWarehouses');
    const currencies = new Set(store.priceEntries().map((entry) => entry.unitPrice.currency));
    expect(currencies.size).toBeGreaterThan(1);
  });

  it('a SKU read again under another persona does not keep the first reader’s answer', async () => {
    await signIn('sofia-ramirez');
    await open('threeWarehouses');
    const withCost = store.detail()!.sku.standardCost.minor;

    await signIn('noah-bennett');
    await store.load();

    expect(withCost).toBeGreaterThan(0);
    expect(store.detail()!.sku.standardCost.minor).toBe(0);
    expect(TestBed.inject(NEXORA_BACKEND)).toBeDefined();
  });
});
