import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { SkuStore } from '../../core/catalog/sku.store';
import { SessionStore } from '../../core/session/session.store';

describe('SkuPage', () => {
  let fixtures: Record<string, string>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const api = await resetTestBackend();
    fixtures = api.demo.fixtures();
  });

  async function open(fixtureKey: string, persona = 'sofia-ramirez'): Promise<RouterTestingHarness> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create(`/catalog/skus/${fixtures[fixtureKey]}`);
    const store = TestBed.inject(SkuStore);
    for (let attempt = 0; attempt < 120 && store.detail() === null; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return harness;
  }

  const textOf = (harness: RouterTestingHarness): string =>
    harness.fixture.nativeElement.textContent as string;

  it('§82.8 — the warehouse rows add up to the figure the card states', async () => {
    const harness = await open('edge.sku.three_warehouses');
    const store = TestBed.inject(SkuStore);
    const rows = harness.fixture.nativeElement.querySelectorAll('tbody[data-part="body"] tr');

    expect(store.stock().length).toBeGreaterThanOrEqual(3);
    expect(rows.length).toBe(store.stock().length);
    // The summary row is the reconciliation RP-07 asks for.
    const summary = harness.fixture.nativeElement.querySelector('tfoot') as HTMLElement;
    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain(String(store.stockSum().available));
    expect(summary.textContent).toContain(`${store.stock().length} warehouses`);
  });

  it('§82.8 — each place is named by its code and the reader’s own is marked', async () => {
    const harness = await open('edge.sku.three_warehouses', 'jordan-wells');
    const text = textOf(harness);
    const store = TestBed.inject(SkuStore);

    for (const row of store.stock()) expect(text).toContain(row.warehouseCode);
    expect(store.stock().some((row) => row.isOwn)).toBe(true);
    expect(text).toContain('Yours');
  });

  it('§82.7 — nothing available with stock on its way is said in one sentence', async () => {
    const harness = await open('edge.sku.zero_available_inbound');
    const text = textOf(harness);

    expect(text).toContain('Nothing available');
    expect(text).toContain('Nothing is available today');
    expect(text).toContain('on their way');
    // What the backend cannot say is said rather than invented.
    expect(text).toContain('not the purchase order behind it');
  });

  it('§82.6 — a discontinued SKU says what it means for the orders that hold it', async () => {
    const harness = await open('edge.sku.discontinued');
    const text = textOf(harness);

    expect(text).toContain('This SKU is discontinued.');
    expect(text).toContain('The orders that already hold it keep it');
    expect(text).toContain('Stock');
  });

  /** PM-01: the value the permission blanks is absent, not drawn as a zero. */
  it('a representative is shown the price and no cost anywhere', async () => {
    const harness = await open('edge.sku.three_warehouses', 'noah-bennett');
    harness.fixture.componentInstance;
    const text = textOf(harness);

    expect(text).toContain('Prices');
    expect(text).not.toContain('Margin');
    expect(text).toContain('cost.view');
    expect(text).not.toContain('$0.00');

    // The Supply tab carries no cost column for this reader.
    const store = TestBed.inject(SkuStore);
    expect(store.canSeeCost()).toBe(false);
    harness.fixture.nativeElement
      .querySelectorAll('[role="tab"]')
      .forEach((tab: HTMLElement) => expect(tab.textContent).not.toContain('Cost'));
  });

  it('a warehouse operator is shown neither price nor cost, and the page says so once', async () => {
    const harness = await open('edge.sku.three_warehouses', 'jordan-wells');
    const text = textOf(harness);

    expect(text).toContain('pricing.view');
    expect(text).toContain('cost.view');
    expect(text.match(/pricing\.view/g)?.length).toBe(1);
    expect(text).not.toContain('$0.00');
    const tabs = [...harness.fixture.nativeElement.querySelectorAll('[role="tab"]')].map(
      (tab) => (tab as HTMLElement).textContent ?? '',
    );
    expect(tabs.some((label) => label.includes('Prices'))).toBe(false);
    expect(tabs.some((label) => label.includes('Stock'))).toBe(true);
  });

  it('a manager is shown both, and the margin reads from a cost that is not zero', async () => {
    const harness = await open('edge.sku.three_warehouses', 'sofia-ramirez');
    const text = textOf(harness);
    const store = TestBed.inject(SkuStore);

    expect(text).toContain('Margin');
    expect(text).toContain('standard cost');
    expect(text).not.toContain('pricing.view');
    expect(store.detail()!.sku.standardCost.minor).toBeGreaterThan(0);
  });

  /** The catalogue has no command: a control for one would be a button that lies. */
  it('offers no control for anything the catalogue cannot do', async () => {
    const harness = await open('edge.sku.three_warehouses');
    const controls = [
      ...harness.fixture.nativeElement.querySelectorAll('button, a[href]'),
    ] as HTMLElement[];

    for (const control of controls) {
      const label = `${control.textContent ?? ''} ${control.getAttribute('aria-label') ?? ''}`;
      expect(label, label).not.toMatch(
        /\b(Edit|Delete|Remove|Save|Create|New |Discontinue|Publish|Adjust|Reorder now)\b/,
      );
    }
  });

  it('every quantity on the page is read in the SKU’s own unit', async () => {
    const harness = await open('edge.sku.three_warehouses');
    const store = TestBed.inject(SkuStore);
    const unit = store.sku()!.unitOfMeasure;

    expect(textOf(harness)).toContain(`in ${unit}`);
    expect(textOf(harness)).not.toMatch(/\d\.000\b/);
  });
});
