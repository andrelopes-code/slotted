import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SlDataGrid } from '@slotted/angular/data-grid';
import { SlToastRegion } from '@slotted/angular/toast';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { OrdersStore } from '../../core/sales/orders.store';
import { SessionStore } from '../../core/session/session.store';

const VIEW_KEY = 'nexora.orders.view';

describe('OrdersPage — the reader’s grid view', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  async function open(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create('/sales/orders');
    const store = TestBed.inject(OrdersStore);
    for (let attempt = 0; attempt < 120 && store.rows().length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return harness;
  }

  const headers = (harness: RouterTestingHarness): string[] =>
    [...harness.fixture.nativeElement.querySelectorAll('[role="columnheader"]')].map(
      (cell) => (cell as HTMLElement).getAttribute('data-column') ?? '',
    );

  const grid = (harness: RouterTestingHarness): SlDataGrid =>
    harness.fixture.debugElement.query(By.directive(SlDataGrid)).injector.get(SlDataGrid);

  it('reads the arrangement kept in the browser, and writes the next one back', async () => {
    localStorage.setItem(VIEW_KEY, `columns=${encodeURIComponent('h=customerName')}&v=1`);
    const harness = await open();

    expect(headers(harness)).not.toContain('customerName');
    expect(headers(harness)).toContain('status');

    grid(harness).hide('status');
    harness.detectChanges();

    expect(headers(harness)).not.toContain('status');
    TestBed.tick();
    const kept = decodeURIComponent(localStorage.getItem(VIEW_KEY) ?? '');
    expect(kept).toContain('customerName');
    expect(kept).toContain('status');
  });

  it('answers a hidden column with a toast whose Undo brings it back in place', async () => {
    const region = TestBed.createComponent(SlToastRegion);
    const harness = await open();
    const before = headers(harness);
    expect(before).toContain('customerName');

    grid(harness).hide('customerName');
    harness.detectChanges();
    region.detectChanges();
    expect(headers(harness)).not.toContain('customerName');

    const toast = region.nativeElement.ownerDocument.body as HTMLElement;
    expect(toast.textContent).toContain('Customer hidden');
    const undo = toast.querySelector('[data-testid="undo-hide"]') as HTMLButtonElement | null;
    expect(undo).not.toBeNull();

    undo!.click();
    harness.detectChanges();
    region.detectChanges();
    expect(headers(harness)).toEqual(before);
  });

  it('offers the saved views, the column manager and the density beside the filters', async () => {
    const harness = await open();
    const root = harness.fixture.nativeElement as HTMLElement;
    const end = root.querySelector('[data-ui="filter-bar"] > [data-part="frame"] > [data-part="end"]');

    expect(end?.querySelector('[data-testid="saved-views"]')).not.toBeNull();
    const trigger = end?.querySelector('[data-testid="columns-trigger"]');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(end?.querySelector('[data-testid="density"]')?.getAttribute('role')).toBe('radiogroup');
  });
});
