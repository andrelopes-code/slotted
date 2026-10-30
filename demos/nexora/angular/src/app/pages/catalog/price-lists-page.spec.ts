import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { PriceListsStore } from '../../core/catalog/price-lists.store';
import { SessionStore } from '../../core/session/session.store';

describe('PriceListsPage', () => {
  let store: PriceListsStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await signInAs('sofia-ramirez');
    await TestBed.inject(SessionStore).load();
    store = TestBed.inject(PriceListsStore);
    store.clearLookup();
  });

  async function open(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create('/catalog/price-lists');
    await store.reload();
    for (let attempt = 0; attempt < 120 && store.lists().length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return harness;
  }

  it('states what the screen cannot do rather than implying otherwise', async () => {
    const harness = await open();
    const text = harness.fixture.nativeElement.textContent as string;

    expect(text).toContain('no endpoint that lists the entries of a price list');
    expect(text).toContain('Price a SKU');
    expect(text).toContain('Name a SKU to see its prices');
  });

  /**
   * The lookup is the screen's answer to the missing endpoint, so the typing
   * that drives it is worth a test: the field is the family's, the query is
   * the store's, and the two are joined by one event.
   */
  it('typing in the lookup searches the SKUs', async () => {
    const harness = await open();
    const input = harness.fixture.nativeElement.querySelector(
      'sl-combobox input',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    input.value = 'AST-SEN';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();

    for (let attempt = 0; attempt < 120 && store.matches().length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }

    expect(store.query()).toBe('AST-SEN');
    expect(store.matches().length).toBeGreaterThan(0);
  });

  it('a chosen SKU is read against every list, the ones that do not price it included', async () => {
    const harness = await open();
    await store.search('AST-SEN');
    await store.choose(store.matches()[0]!.id);
    harness.detectChanges();

    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain(store.chosen()!.sku.sku);
    for (const row of store.skuPrices()) expect(text).toContain(row.listName);
    expect(text).toMatch(/lists price this SKU|Every one of the/);
  });
});
