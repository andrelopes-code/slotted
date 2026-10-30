import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CHART_ENGINE } from '@slotted/angular/chart';
import type { ApprovalListItem, NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { NotificationsStore } from '../core/activity/notifications.store';
import { NAV_MODULES } from '../core/nav/nav.model';
import { SessionStore } from '../core/session/session.store';
import { ApprovalsPage } from './approvals/approvals-page';

/** jsdom has no layout: the overview's charts are drawn by an engine that records nothing. */
const silentEngine = () => ({
  update: () => Promise.resolve(),
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});

/** The module is done when no route under /finance opens on the placeholder. */
describe('the Finance routes', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTestBackend(), provideRouter(routes), { provide: CHART_ENGINE, useValue: silentEngine }],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('maya-chen');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const paths = ['/finance/overview', '/finance/invoices', '/finance/payments', '/finance/reconciliation'];

  const settle = async (harness: RouterTestingHarness, text: string): Promise<string> => {
    for (let attempt = 0; attempt < 160; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes(text)) break;
    }
    return harness.fixture.nativeElement.textContent as string;
  };

  it('opens a screen of its own on every destination of the module, and on the forms and credit memos', async () => {
    const harness = await RouterTestingHarness.create(paths[0]!);
    for (const path of [
      ...paths,
      '/finance/payments/new',
      '/finance/invoices/credit-memos',
      '/finance/invoices/credit-memos/new',
    ]) {
      await harness.navigateByUrl(path);
      harness.detectChanges();
      const text = harness.fixture.nativeElement.textContent as string;
      expect(text, path).not.toContain('is part of the');
      expect(text, path).not.toContain('is not built yet');
      expect(TestBed.inject(Router).url, path).toBe(path);
    }
  }, 60_000);

  it('every destination the navigation names has a screen', () => {
    const finance = NAV_MODULES.find((module) => module.id === 'finance')!;
    expect(finance.destinations.map((destination) => destination.path).sort()).toEqual([...paths].sort());
  });

  it('declares /new and credit-memos before :id, so neither is read as a record id', async () => {
    const harness = await RouterTestingHarness.create('/finance/payments/new');
    expect(await settle(harness, 'Record payment')).toContain('Record payment');
    await harness.navigateByUrl('/finance/invoices/credit-memos');
    expect(await settle(harness, 'Credit memos')).toContain('Credit memos');
    await harness.navigateByUrl('/finance/invoices/credit-memos/new');
    expect(await settle(harness, 'New credit memo')).toContain('New credit memo');
  });

  it.each([
    ['/finance/invoices/inv_does_not_exist', 'This invoice does not exist'],
    ['/finance/payments/pay_does_not_exist', 'This payment does not exist'],
    ['/finance/invoices/credit-memos/cm_does_not_exist', 'This credit memo does not exist'],
    ['/finance/reconciliation/btx_does_not_exist', 'This bank transaction does not exist'],
  ])('keeps %s on its own url and answers with the page’s own not-found (RP-04)', async (path, words) => {
    const harness = await RouterTestingHarness.create(path);
    expect(await settle(harness, words)).toContain(words);
    expect(TestBed.inject(Router).url).toBe(path);
  });

  it('tells Jordan Wells the module is not theirs, rather than opening it empty', async () => {
    await signIn('jordan-wells');
    const harness = await RouterTestingHarness.create('/finance/overview');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('finance.dashboard');
    await harness.navigateByUrl('/finance/invoices');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('invoices.view');
  });

  it('opens Finance on the invoices for a representative, who holds them and not the overview', async () => {
    await signIn('noah-bennett');
    const harness = await RouterTestingHarness.create('/finance');
    expect(TestBed.inject(Router).url).toBe('/finance/invoices');
    await harness.navigateByUrl('/finance/payments');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('payments.view');
  });

  it('refuses the payment form to a persona without payments.record, and keeps the url', async () => {
    await signIn('evan-brooks');
    const harness = await RouterTestingHarness.create('/finance/payments/new');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('payments.record');
    expect(TestBed.inject(Router).url).toBe('/finance/payments/new');
  });

  it('leads an invoice notification to the invoice', async () => {
    const invoice = api.demo.fixtures()['edge.invoice.partially_paid']!;
    const route = TestBed.inject(NotificationsStore).routeFor({
      id: 'ntf_1',
      organizationId: 'org_000001',
      userId: 'usr_1',
      type: 'warning',
      title: 'Overdue',
      body: '',
      createdAt: '2026-09-04T10:00:00Z',
      entityType: 'invoice',
      entityId: invoice,
    });
    expect(route).toBe(`/finance/invoices/${invoice}`);
  });

  it('leads a write-off approval to its invoice, and a count’s approval to the count', () => {
    const page = TestBed.runInInjectionContext(() => new ApprovalsPage());
    const row = (targetType: ApprovalListItem['targetType'], targetId: string) =>
      ({ targetType, targetId }) as ApprovalListItem;
    expect(page.routeFor(row('invoice_write_off', 'inv_1'))).toBe('/finance/invoices/inv_1');
    expect(page.routeFor(row('cycle_count', 'cc_1'))).toBe('/inventory/cycle-counts/cc_1');
  });

  it('opens the approvals queue to the finance controller, who decides write-offs there', async () => {
    await signIn('finance-controller');
    const harness = await RouterTestingHarness.create('/sales/approvals');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).not.toContain('orders.approve');
  });
});
