import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CHART_ENGINE } from '@slotted/angular/chart';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { NotificationsStore } from '../core/activity/notifications.store';
import { NAV_MODULES } from '../core/nav/nav.model';
import { SessionStore } from '../core/session/session.store';

/** jsdom has no layout: the receiving chart is drawn by an engine that records nothing. */
const silentEngine = () => ({
  update: () => Promise.resolve(),
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});

/** The module is done when no route under /procurement opens on the placeholder. */
describe('the Procurement routes', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTestBackend(), provideRouter(routes), { provide: CHART_ENGINE, useValue: silentEngine }],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signInAs('maya-chen');
    await TestBed.inject(SessionStore).load();
  });

  const paths = ['/procurement/suppliers', '/procurement/purchase-orders', '/procurement/receiving'];

  const settle = async (harness: RouterTestingHarness, text: string): Promise<string> => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes(text)) break;
    }
    return harness.fixture.nativeElement.textContent as string;
  };

  it('opens a screen of its own on every destination of the module, and on the two create forms', async () => {
    const harness = await RouterTestingHarness.create(paths[0]!);
    for (const path of [...paths, '/procurement/suppliers/new', '/procurement/purchase-orders/new']) {
      await harness.navigateByUrl(path);
      harness.detectChanges();
      const text = harness.fixture.nativeElement.textContent as string;
      expect(text, path).not.toContain('is part of the');
      expect(text, path).not.toContain('is not built yet');
      expect(TestBed.inject(Router).url, path).toBe(path);
    }
  }, 60_000);

  it('every destination the navigation names has a screen', () => {
    const procurement = NAV_MODULES.find((module) => module.id === 'procurement')!;
    expect(procurement.destinations.map((destination) => destination.path).sort()).toEqual([...paths].sort());
  });

  it('declares /new before :id, so "new" is never read as a supplier or an order id', async () => {
    const harness = await RouterTestingHarness.create('/procurement/purchase-orders/new');
    expect(await settle(harness, 'New purchase order')).toContain('New purchase order');
    await harness.navigateByUrl('/procurement/suppliers/new');
    expect(await settle(harness, 'New supplier')).toContain('New supplier');
  });

  it.each([
    ['/procurement/suppliers/sup_does_not_exist', 'This supplier does not exist'],
    ['/procurement/purchase-orders/po_does_not_exist', 'This purchase order does not exist'],
    ['/procurement/receiving/grc_does_not_exist', 'This receipt does not exist'],
  ])('keeps %s on its own url and answers with the page’s own not-found (RP-04)', async (path, words) => {
    const harness = await RouterTestingHarness.create(path);
    expect(await settle(harness, words)).toContain(words);
    expect(TestBed.inject(Router).url).toBe(path);
  });

  it('opens a goods receipt at the receiving destination’s :id, the one address a receipt has', async () => {
    const po = await api.purchaseOrders.get(api.demo.fixtures()['edge.receipt.damaged']!);
    const receipt = po.receipts[0]!;
    const harness = await RouterTestingHarness.create(`/procurement/receiving/${receipt.id}`);
    const text = await settle(harness, receipt.receiptNumber);
    expect(text).toContain(receipt.receiptNumber);
    expect(text).toContain(po.purchaseOrder.purchaseOrderNumber);
  });

  it('refuses the create forms to a persona without the command, and keeps the url', async () => {
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create('/procurement/purchase-orders/new');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('purchase_orders.create');
    expect(TestBed.inject(Router).url).toBe('/procurement/purchase-orders/new');

    await signInAs('marcus-lee');
    await TestBed.inject(SessionStore).load();
    await harness.navigateByUrl('/procurement/suppliers/new');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('suppliers.manage');
  });

  it.each(['sofia-ramirez', 'aisha-grant'])(
    'tells %s the module is not theirs, rather than opening it empty',
    async (persona) => {
      await signInAs(persona);
      await TestBed.inject(SessionStore).load();
      const harness = await RouterTestingHarness.create('/procurement/purchase-orders');
      harness.detectChanges();
      const text = harness.fixture.nativeElement.textContent as string;
      expect(text).toContain('purchase_orders.view');
      expect(text).not.toContain('Purchase orders to every warehouse');
    },
  );

  it('opens the purchase orders to Jordan Wells without suppliers.view, and the suppliers not at all', async () => {
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create('/procurement/purchase-orders');
    expect(await settle(harness, 'bound for CHI-01')).toContain('Purchase orders bound for CHI-01');
    await harness.navigateByUrl('/procurement/suppliers');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('suppliers.view');
  });

  it('leads a purchase order notification to the order, not to the list', async () => {
    const po = api.demo.fixtures()['edge.po.delayed']!;
    const route = TestBed.inject(NotificationsStore).routeFor({
      id: 'ntf_1',
      organizationId: 'org_000001',
      userId: 'usr_1',
      type: 'warning',
      title: 'Late',
      body: '',
      createdAt: '2026-09-04T10:00:00Z',
      entityType: 'purchase_order',
      entityId: po,
    });
    expect(route).toBe(`/procurement/purchase-orders/${po}`);
    const approval = TestBed.inject(NotificationsStore).routeFor({
      id: 'ntf_2',
      organizationId: 'org_000001',
      userId: 'usr_1',
      type: 'action_required',
      title: 'Approval requested',
      body: '',
      createdAt: '2026-09-04T10:00:00Z',
      entityType: 'approval_request',
      entityId: 'apr_1',
    });
    expect(approval).toBe('/sales/approvals');
  });

  it('opens the approvals queue to the procurement lead, who decides purchase orders there', async () => {
    await signInAs('procurement-lead');
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create('/sales/approvals');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).not.toContain('orders.approve');
  });
});
