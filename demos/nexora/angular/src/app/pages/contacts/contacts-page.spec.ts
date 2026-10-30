import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RouterTestingHarness } from '@angular/router/testing';
import { SlDataGrid } from '@slotted/angular/data-grid';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { ContactsStore } from '../../core/crm/contacts.store';
import { SessionStore } from '../../core/session/session.store';

describe('ContactsPage', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(ContactsStore);
    store.loaded.set([]);
    store.page.set({ index: 0, size: 25 });
    store.search.set('');
    store.filter.set(null);
  });

  async function open(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create('/crm/contacts');
    const store = TestBed.inject(ContactsStore);
    for (let attempt = 0; attempt < 120 && store.loaded().length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return harness;
  }

  it('says what it counts: contacts in the bar, accounts in the pager', async () => {
    const harness = await open();
    const store = TestBed.inject(ContactsStore);
    const text = harness.fixture.nativeElement.textContent as string;

    expect(text).toContain(`${store.rows().length} contacts`);
    expect(text).toContain(`Accounts 1–25 of ${store.accountTotal()!.toLocaleString('en-US')}`);
    expect(text).toContain('Accounts per page');
    // The page states the reach of its own search rather than implying the tenant.
    expect(text).toContain('Nexora reads contacts one account at a time');
  });

  /**
   * The rule is read from the sheet rather than from the box: jsdom lays
   * nothing out, and what must not come back is the declaration.
   */
  it('gives the grid the height the bar leaves, so the page does not scroll (LP-12)', async () => {
    const harness = await open();
    const grid = harness.fixture.nativeElement.querySelector('sl-data-grid') as HTMLElement;
    expect(grid.closest('.listing')).not.toBeNull();

    const sheet = [...document.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .find((css) => css.includes('.listing') && css.includes('sl-data-grid'));
    expect(sheet).toBeDefined();
    expect(sheet!.replace(/\s+/g, ' ')).toMatch(
      /\.listing[^{]*\{[^}]*display: flex;[^}]*flex-direction: column;/,
    );
    expect(sheet!.replace(/\s+/g, ' ')).toMatch(
      /sl-data-grid[^{]*\{[^}]*flex: 1 1 0;[^}]*min-block-size: 0;/,
    );
  });

  it('starts with the phone hidden and keeps the reader’s arrangement in the browser', async () => {
    const harness = await open();
    const headers = () =>
      [...harness.fixture.nativeElement.querySelectorAll('[role="columnheader"]')].map((cell) =>
        (cell as HTMLElement).getAttribute('data-column'),
      );
    expect(headers()).not.toContain('phone');
    expect(headers()).toContain('email');

    const grid = harness.fixture.debugElement
      .query(By.directive(SlDataGrid))
      .injector.get(SlDataGrid);
    grid.hide('email');
    harness.detectChanges();
    TestBed.tick();

    expect(headers()).not.toContain('email');
    expect(decodeURIComponent(localStorage.getItem('nexora.contacts.view') ?? '')).toContain(
      'h=phone,email',
    );
  });

  it('opens the account of the contact a row names', async () => {
    const harness = await open();
    const store = TestBed.inject(ContactsStore);
    const row = store.rows()[0]!;
    const link = harness.fixture.nativeElement.querySelector(
      `a[href="/crm/customers/${row.customerId}"]`,
    ) as HTMLAnchorElement | null;

    expect(link).not.toBeNull();
    expect(link!.textContent?.trim()).toBe(row.customerName);
  });
});
