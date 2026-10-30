import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { CustomerStore } from '../../core/crm/customer.store';
import { SessionStore } from '../../core/session/session.store';

describe('CustomerPage', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  async function openRecord(): Promise<{ harness: RouterTestingHarness; id: string }> {
    const page = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    const id = page.data[0]!.id;
    const harness = await RouterTestingHarness.create(`/crm/customers/${id}`);
    const store = TestBed.inject(CustomerStore);
    for (
      let attempt = 0;
      attempt < 120 && (store.customer() === null || store.loading());
      attempt += 1
    ) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return { harness, id };
  }

  const element = (harness: RouterTestingHarness, selector: string): HTMLElement =>
    harness.fixture.nativeElement.querySelector(selector) as HTMLElement;

  it('AF-07 — Refresh reads the account again: the old values stay, the page is busy and the button waits, then the new ones land', async () => {
    const { harness, id } = await openRecord();
    const store = TestBed.inject(CustomerStore);
    const before = store.customer()!.displayName;
    // Another writer renames the account while the page is open.
    await api.customers.update(
      id,
      { displayName: 'Renamed Elsewhere Ltd' },
      { ifMatch: store.customer()!.metadata.version },
    );

    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const real = api.customers.get.bind(api.customers);
    const read = vi.spyOn(api.customers, 'get').mockImplementationOnce(async (...args) => {
      await gate;
      return real(...args);
    });

    const refresh = element(harness, '[data-testid="refresh"]');
    expect(refresh.getAttribute('aria-label')).toBe('Refresh');
    refresh.click();
    for (let attempt = 0; attempt < 40 && read.mock.calls.length === 0; attempt += 1)
      await new Promise((resolve) => setTimeout(resolve, 5));
    harness.detectChanges();

    expect(read).toHaveBeenCalledWith(id);
    expect(element(harness, '[data-ui="page"]').hasAttribute('data-loading')).toBe(true);
    expect(
      element(harness, '[data-ui="page"] > [data-part="scroll"] > [data-part="body"]').getAttribute(
        'aria-busy',
      ),
    ).toBe('true');
    expect(refresh.hasAttribute('data-loading')).toBe(true);
    // The values on screen stay while the answer is on its way: no placeholder in their place.
    expect(element(harness, 'h1').textContent).toContain(before);

    release();
    for (let attempt = 0; attempt < 120 && store.loading(); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();

    expect(element(harness, 'h1').textContent).toContain('Renamed Elsewhere Ltd');
    expect(element(harness, '[data-ui="page"]').hasAttribute('data-loading')).toBe(false);
    expect(
      element(harness, '[data-ui="page"] > [data-part="scroll"] > [data-part="body"]').hasAttribute(
        'aria-busy',
      ),
    ).toBe(false);
    expect(refresh.hasAttribute('data-loading')).toBe(false);
    read.mockRestore();
  });

  it('AF-02 — a first read is not a refresh: the page is not busy while no account is shown', async () => {
    const page = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const real = api.customers.get.bind(api.customers);
    const read = vi.spyOn(api.customers, 'get').mockImplementationOnce(async (...args) => {
      await gate;
      return real(...args);
    });

    const harness = await RouterTestingHarness.create(`/crm/customers/${page.data[1]!.id}`);
    harness.detectChanges();
    expect(TestBed.inject(CustomerStore).loading()).toBe(true);
    expect(element(harness, '[data-ui="page"]').hasAttribute('data-loading')).toBe(false);

    release();
    read.mockRestore();
  });
});
