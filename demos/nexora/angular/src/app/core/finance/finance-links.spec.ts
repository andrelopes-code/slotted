import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { OrderStore } from '../sales/order.store';
import { SessionStore } from '../session/session.store';

/**
 * Where the modules already built lead into Finance: an order's invoices,
 * the invoice an order still owes, and a customer's payment.
 */
describe('the ways into Finance from the other modules', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const settle = async (harness: RouterTestingHarness, done: () => boolean): Promise<HTMLElement> => {
    for (let attempt = 0; attempt < 160 && !done(); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return harness.fixture.nativeElement as HTMLElement;
  };

  const tabs = (root: HTMLElement): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
  const hasTab = (root: HTMLElement, label: string): boolean =>
    tabs(root).some((element) => element.textContent!.trim().startsWith(label));
  const tab = (root: HTMLElement, label: string): HTMLElement =>
    tabs(root).find((element) => element.textContent!.trim().startsWith(label))!;

  /**
   * An order with a line shipped and not yet invoiced (§66.4). The seed
   * invoices every shipment as it leaves, so a shipment ready at the dock is
   * shipped first, as the warehouse would.
   */
  async function orderToInvoice(): Promise<string> {
    await signInAs('maya-chen');
    const ready = (await api.shipments.list({ pageSize: 25, filter: { status: { in: ['ready_to_ship'] } } })).data[0]!;
    await api.shipments.ship(ready.id, {}, { ifMatch: ready.metadata.version });
    return ready.orderId;
  }

  it('lists an order’s invoices as links to their records', async () => {
    await signIn('priya-shah');
    const order = (await api.orders.list({ pageSize: 25, filter: { invoiceStatus: { in: ['invoiced'] } } })).data[0]!;
    const harness = await RouterTestingHarness.create(`/sales/orders/${order.id}`);
    const store = TestBed.inject(OrderStore);
    await settle(harness, () => store.detail() !== null);
    expect(store.detail()!.invoices.length).toBeGreaterThan(0);
    tab(harness.fixture.nativeElement, 'Invoices').click();
    const element = await settle(harness, () => !!harness.fixture.nativeElement.querySelector('[data-testid="order-invoice"]'));
    const link = element.querySelector('[data-testid="order-invoice"]') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe(`/finance/invoices/${store.detail()!.invoices[0]!.id}`);
  }, 60_000);

  it('writes a draft invoice of what shipped and was not invoiced, and opens it', async () => {
    await signIn('priya-shah');
    const orderId = await orderToInvoice();
    const store = TestBed.inject(OrderStore);
    await store.open(orderId);
    const before = store.uninvoicedLines().length;
    expect(before).toBeGreaterThan(0);
    const invoiceId = await store.createInvoice();
    expect(invoiceId).not.toBeNull();
    expect(store.uninvoicedLines()).toHaveLength(0);
    const invoice = await api.finance.invoices.get(invoiceId!);
    expect(invoice.invoice.lifecycle).toBe('draft');
    expect(invoice.lines).toHaveLength(before);
  }, 60_000);

  it('offers Create invoice only to a holder of invoices.create, on the Invoices tab', async () => {
    const orderId = await orderToInvoice();
    const harness = await RouterTestingHarness.create('/dashboard');
    for (const [persona, offered] of [
      ['priya-shah', true],
      ['sofia-ramirez', false],
    ] as const) {
      await signIn(persona);
      await harness.navigateByUrl('/dashboard');
      await harness.navigateByUrl(`/sales/orders/${orderId}`);
      const store = TestBed.inject(OrderStore);
      await store.load();
      await settle(harness, () => store.detail() !== null && hasTab(harness.fixture.nativeElement, 'Invoices'));
      const element = harness.fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[data-testid="create-invoice"]'), 'lines tab').toBeNull();
      tab(element, 'Invoices').click();
      await settle(harness, () => false);
      expect(!!element.querySelector('[data-testid="create-invoice"]'), persona).toBe(offered);
      if (!offered) expect(element.textContent).toContain('invoices.create');
    }
  }, 60_000);

  it('leads a finance reader from a customer’s invoices to the payment form, opened on that customer', async () => {
    const customer = api.demo.fixtures()['flagship.customer.meridian']!;
    await signIn('priya-shah');
    const harness = await RouterTestingHarness.create(`/crm/customers/${customer}`);
    let element = await settle(harness, () => hasTab(harness.fixture.nativeElement, 'Invoices'));
    tab(element, 'Invoices').click();
    element = await settle(harness, () => !!harness.fixture.nativeElement.querySelector('[data-testid="record-payment"]'));
    const link = element.querySelector('[data-testid="record-payment"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/finance/payments/new?customer=${customer}`);

    await signIn('sofia-ramirez');
    await harness.navigateByUrl('/dashboard');
    await harness.navigateByUrl(`/crm/customers/${customer}`);
    element = await settle(harness, () => hasTab(harness.fixture.nativeElement, 'Invoices'));
    tab(element, 'Invoices').click();
    element = await settle(harness, () => false);
    expect(element.querySelector('[data-testid="record-payment"]')).toBeNull();
    expect(TestBed.inject(Router).url).toBe(`/crm/customers/${customer}`);
  }, 60_000);
});
