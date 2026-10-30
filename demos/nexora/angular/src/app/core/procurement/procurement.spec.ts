import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { NexoraApi, SupplierListItem } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { purchaseOrderColumns, supplierColumns, supplierFilterFields } from '../../pages/procurement/procurement-columns';
import { WarehousesStore } from '../catalog/warehouses.store';
import { milli, movementSourceLink } from '../inventory/inventory.model';
import { SessionStore } from '../session/session.store';
import { lineKey } from './po-draft';
import { RECEIVABLE } from './procurement.model';
import { PurchaseOrderDraftStore } from './purchase-order-draft.store';
import { PurchaseOrderEditStore } from './purchase-order-edit.store';
import { PurchaseOrderStore } from './purchase-order.store';
import { PurchaseOrdersStore } from './purchase-orders.store';
import { receiptKey, ReceiptDraftStore } from './receipt-draft.store';
import { ReceivingStore } from './receiving.store';
import { SupplierStore } from './supplier.store';

const CHI = 'wh_000001';
const DAL = 'wh_000002';

describe('the procurement module', () => {
  let api: NexoraApi;
  let fixtures: Record<string, string>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    fixtures = api.demo.fixtures();
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const can = (permissions: readonly string[]) => (permission: string) => permissions.includes(permission);

  /** An active supplier of the tier asked for, in US dollars, that maps at least one SKU. */
  async function supplierOf(tier: SupplierListItem['relationshipTier']): Promise<SupplierListItem> {
    const answer = await api.suppliers.list({
      pageSize: 25,
      sort: 'displayName',
      filter: { status: { eq: 'active' }, relationshipTier: { eq: tier }, skuCount: { gte: 1 } },
    });
    const supplier = answer.data.find((row) => row.supportedCurrencies[0] === 'USD');
    if (!supplier) throw new Error(`no active ${tier} supplier`);
    return supplier;
  }

  /** A draft for the supplier's first SKU, at a quantity worth about the dollars asked for. */
  async function draftWorth(tier: SupplierListItem['relationshipTier'], dollars: number) {
    const store = TestBed.inject(PurchaseOrderDraftStore);
    store.reset();
    await TestBed.inject(WarehousesStore).open();
    await store.chooseSupplier(await supplierOf(tier));
    const mapping = store.lineOptions()[0]!;
    await store.addSku(mapping.skuId);
    const line = store.lines()[0]!;
    store.setUnitCost(line.skuId, mapping.unitCost.minor / 100);
    store.setQuantity(line.skuId, Math.max(1, Math.ceil((dollars * 100) / mapping.unitCost.minor)));
    store.destinationWarehouseId.set(CHI);
    return store;
  }

  describe('the approval, said before the submit (FM-11)', () => {
    beforeEach(() => signIn('marcus-lee'));

    it('asks for a Procurement Manager from US$25,000, and the submit asks for what the form said', async () => {
      const store = await draftWorth('standard', 30_000);
      const preview = store.approval()!;
      expect(preview.required).toBe(true);
      expect(preview.steps.map((step) => step.requiredRole)).toEqual(['procurement_manager']);
      expect(preview.reasons).toContain('purchase order value at or above $25,000');

      const result = await store.create(true);
      expect(result?.submitFailure).toBeNull();
      expect(result?.po.status).toBe('pending_approval');
      const detail = await api.purchaseOrders.get(result!.po.id);
      expect(detail.approval?.steps.map((step) => step.requiredRole)).toEqual(['procurement_manager']);
      expect(detail.approval?.reasons).toEqual(preview.reasons);
    });

    it('adds a Finance Manager from US$100,000', async () => {
      const store = await draftWorth('standard', 120_000);
      expect(store.approval()!.steps.map((step) => step.requiredRole)).toEqual([
        'procurement_manager',
        'finance_manager',
      ]);
    });

    it('approves at once under US$25,000 from a standard supplier, and says so', async () => {
      const store = await draftWorth('standard', 2_000);
      expect(store.approval()!.required).toBe(false);
      const result = await store.create(true);
      expect(result?.po.status).toBe('approved');
    });

    it('sends every order to a conditional supplier through a Procurement Manager, whatever its value', async () => {
      const store = await draftWorth('conditional', 500);
      expect(store.approval()!.required).toBe(true);
      expect(store.approval()!.reasons).toContain('supplier relationship tier is conditional');
    });

    it('refuses an on-hold supplier at the field, before the backend does', async () => {
      const store = TestBed.inject(PurchaseOrderDraftStore);
      store.reset();
      const held = (await api.suppliers.list({ pageSize: 25, filter: { status: { eq: 'on_hold' } } })).data[0]!;
      await store.chooseSupplier(held);
      expect(store.supplierRefusal()).toContain('on hold');
      expect(store.check()['supplierId']).toBeDefined();
    });

    it('keeps the draft when the reader leaves and opens the same link again (FM-05)', async () => {
      const store = TestBed.inject(PurchaseOrderDraftStore);
      store.reset();
      const position = (
        await api.inventory.list({ pageSize: 25, filter: { warehouseId: { eq: CHI }, belowReorderPoint: { eq: true } } })
      ).data.find((row) => row.reorderSuggested)!;
      const sku = (await api.catalog.skus({ pageSize: 25, filter: { id: { eq: position.skuId } } })).data[0]!;
      const params = {
        sku: position.skuId,
        warehouse: CHI,
        quantity: position.suggestedQuantity,
        supplier: sku.preferredSupplierId ?? null,
      };
      await store.prefill(params);
      expect(store.destinationWarehouseId()).toBe(CHI);
      if (params.supplier !== null) {
        expect(store.supplier()?.id).toBe(params.supplier);
        expect(store.lines().map((line) => line.skuId)).toEqual([position.skuId]);
        expect(store.lines()[0]!.quantity).toBe(Number(position.suggestedQuantity));
      }
      store.notes.set('Expedite for the backorder.');
      await store.prefill(params);
      expect(store.notes()).toBe('Expedite for the backorder.');
    });
  });

  describe('the commands of each state (RP-09)', () => {
    it('closes short, and never cancels, an order that has received anything', async () => {
      await signIn('maya-chen');
      const store = TestBed.inject(PurchaseOrderStore);
      await store.open(fixtures['edge.po.partially_received']!);
      expect(store.po()?.status).toBe('partially_received');
      expect(store.commands()).toContain('close');
      expect(store.commands()).not.toContain('cancel');
    });

    it('cancels, and does not close short, a sent order with nothing received', async () => {
      await signIn('maya-chen');
      const sent = (await api.purchaseOrders.list({ pageSize: 25, filter: { status: { eq: 'sent' }, receivedShareBps: { eq: 0 } } })).data[0]!;
      const store = TestBed.inject(PurchaseOrderStore);
      await store.open(sent.id);
      expect(store.commands()).toContain('cancel');
      expect(store.commands()).not.toContain('close');
    });

    it('gives a buyer neither cancel nor receive, and a receipt to no one outside the destination', async () => {
      await signIn('marcus-lee');
      const store = TestBed.inject(PurchaseOrderStore);
      await store.open(fixtures['edge.po.delayed']!);
      expect(store.commands()).toEqual([]);
      expect(store.canReceive()).toBe(false);
    });

    it('leaves a Procurement Manager step to the procurement lead, and not to the administrator', async () => {
      await signIn('maya-chen');
      const pending = (await api.purchaseOrders.list({ pageSize: 25, filter: { status: { eq: 'pending_approval' } } })).data[0]!;
      const store = TestBed.inject(PurchaseOrderStore);
      await store.open(pending.id);
      expect(store.approvalRequest()?.steps[0]?.requiredRole).toBe('procurement_manager');
      expect(await store.decide('approve', '')).toBe(false);
      expect(store.failure()?.kind).toBe('permission');
      expect(store.po()?.status).toBe('pending_approval');

      await signIn('procurement-lead');
      await store.open(pending.id);
      expect(await store.decide('approve', '')).toBe(true);
      expect(store.approvalRequest()?.steps[0]?.status).toBe('approved');
    });
  });

  describe('the receipt (§65.7)', () => {
    it('stops a warehouse operator at the line past 5% over the order, before the backend does', async () => {
      await signIn('jordan-wells');
      const record = TestBed.inject(PurchaseOrderStore);
      await record.open(fixtures['flagship.po.mx240_replenishment']!);
      expect(record.canReceive()).toBe(true);
      const receipt = TestBed.inject(ReceiptDraftStore);
      await receipt.start();
      const line = record.rows()[0]!;
      receipt.patch(line.id, { accepted: Number(line.orderedQuantity) + 1 });
      expect(receipt.overTolerance().map((row) => row.id)).toEqual([line.id]);
      expect(receipt.check()[receiptKey(line.id, 'accepted')]?.[0]).toContain('purchase_orders.approve');
      expect(await receipt.receive()).toBe(false);
      expect(record.po()?.status).toBe('acknowledged');
    });

    it('lets a holder of purchase_orders.approve go past it with a reason, and asks for the reason first', async () => {
      await signIn('maya-chen');
      const record = TestBed.inject(PurchaseOrderStore);
      await record.open(fixtures['flagship.po.mx240_replenishment']!);
      const receipt = TestBed.inject(ReceiptDraftStore);
      await receipt.start();
      const line = record.rows()[0]!;
      receipt.patch(line.id, { accepted: Number(line.orderedQuantity) + 1 });
      expect(receipt.check()['overReceiptReason']).toBeDefined();
      receipt.setReason('Supplier shipped a full carton; kept for the backorder.');
      expect(await receipt.receive()).toBe(true);
      expect(record.po()?.status).toBe('received');
    });

    it('receives in part with damaged and rejected units, reports the partial success and writes the movements', async () => {
      await signIn('jordan-wells');
      const record = TestBed.inject(PurchaseOrderStore);
      await record.open(fixtures['edge.po.delayed']!);
      const receipt = TestBed.inject(ReceiptDraftStore);
      await receipt.start();
      const [first, ...rest] = record.rows();
      for (const row of rest) receipt.patch(row.id, { accepted: null });
      receipt.patch(first!.id, { accepted: 50, damaged: 2, rejected: 3 });
      expect(receipt.outcome()).toMatchObject({ intoStock: 1, damaged: 1, rejected: 1, complete: false });
      expect(await receipt.receive()).toBe(true);
      expect(receipt.written()).toMatchObject({ complete: false });
      expect(record.po()?.status).toBe('partially_received');
      const moved = await api.inventory.movements({
        pageSize: 25,
        filter: { sourceEntityId: { eq: receipt.written()!.id } },
      });
      // The accepted and damaged units enter as one receipt; the damaged then move to their bucket.
      expect(moved.data.map((movement) => movement.type).sort()).toEqual(['damage', 'receipt']);
      expect(moved.data.find((movement) => movement.type === 'receipt')?.onHandDelta).toBe('52');
    });

    it('refuses an empty receipt at the form, with the backend’s own rule', async () => {
      await signIn('maya-chen');
      const record = TestBed.inject(PurchaseOrderStore);
      await record.open(fixtures['edge.po.delayed']!);
      const receipt = TestBed.inject(ReceiptDraftStore);
      await receipt.start();
      for (const row of record.rows()) receipt.patch(row.id, { accepted: null });
      expect(receipt.check()['lines']).toBeDefined();
    });
  });

  describe('warehouse scope (§55.3)', () => {
    beforeEach(() => signIn('jordan-wells'));

    it('lists Jordan the orders bound for CHI-01 only', async () => {
      const store = TestBed.inject(PurchaseOrdersStore);
      await store.open();
      expect(store.rows().length).toBeGreaterThan(0);
      expect(new Set(store.rows().map((row) => row.destinationWarehouseId))).toEqual(new Set([CHI]));
    });

    it('queues for Jordan only what CHI-01 can receive', async () => {
      const store = TestBed.inject(ReceivingStore);
      await store.open();
      expect(store.rows().length).toBeGreaterThan(0);
      for (const row of store.rows()) {
        expect(row.destinationWarehouseId).toBe(CHI);
        expect(RECEIVABLE).toContain(row.status);
      }
      await store.loadByWarehouse();
      expect(store.byWarehouse().value?.map((row) => row.code)).toEqual(['CHI-01']);
    });

    it('refuses Jordan an order bound for Dallas, and offers no command on it', async () => {
      await signIn('maya-chen');
      const dallas = (await api.purchaseOrders.list({ pageSize: 25, filter: { warehouseId: { eq: DAL } } })).data[0]!;
      await signIn('jordan-wells');
      const store = TestBed.inject(PurchaseOrderStore);
      await store.open(dallas.id);
      expect(store.po()).toBeNull();
      expect(store.error()?.code).toBe('FORBIDDEN');
      expect(store.commands()).toEqual([]);
    });
  });

  describe('purchase prices are costs (§55, PM-01)', () => {
    it('leaves the spend and the totals out of the models without cost.view', () => {
      const without = can(['suppliers.view', 'purchase_orders.view']);
      expect(supplierColumns(without).map((column) => column.id)).not.toContain('annualSpendUsd');
      expect(supplierFilterFields(without).map((field) => field.key)).not.toContain('annualSpendUsd');
      expect(purchaseOrderColumns(without).map((column) => column.id)).not.toContain('total');
      expect(purchaseOrderColumns(can(['cost.view'])).map((column) => column.id)).toContain('total');
    });

    it('builds nothing from the money a warehouse operator is given written down to nought', async () => {
      await signIn('jordan-wells');
      const store = TestBed.inject(PurchaseOrderStore);
      await store.open(fixtures['edge.po.delayed']!);
      expect(store.po()!.total.minor).toBe(0);
      expect(store.canSeeCost()).toBe(false);
      expect(store.submitPreview()).toBeNull();
    });
  });

  describe('the edit (§65.6)', () => {
    beforeEach(() => signIn('marcus-lee'));

    it('says that changing an approved order’s lines withdraws the approval, and the save does', async () => {
      const draft = await draftWorth('standard', 1_000);
      const result = await draft.create(true);
      expect(result?.po.status).toBe('approved');
      const record = TestBed.inject(PurchaseOrderStore);
      await record.open(result!.po.id);
      const edit = TestBed.inject(PurchaseOrderEditStore);
      await edit.start();
      edit.patch({ notes: 'Dock 3.' });
      expect(edit.withdrawsApproval()).toBe(false);
      const line = edit.draft()!.lines[0]!;
      edit.patchLine(line.skuId, { quantity: (line.quantity ?? 1) + 1 });
      expect(edit.withdrawsApproval()).toBe(true);
      expect(await edit.save()).toBe(true);
      expect(record.po()?.status).toBe('draft');
    });

    it('answers a version someone else moved past with what they changed, and keeps what the reader wrote (FM-08)', async () => {
      const draft = await draftWorth('standard', 1_000);
      const result = await draft.create(false);
      const record = TestBed.inject(PurchaseOrderStore);
      await record.open(result!.po.id);
      const edit = TestBed.inject(PurchaseOrderEditStore);
      await edit.start();
      edit.patch({ notes: 'Mine.' });
      await api.purchaseOrders.update(result!.po.id, { freightMinor: 12_500 }, { ifMatch: record.po()!.metadata.version });
      expect(await edit.save()).toBe(false);
      expect(edit.conflict()?.map((field) => field.label)).toEqual(['Freight']);
      expect(edit.draft()?.notes).toBe('Mine.');
      expect(await edit.applyMine()).toBe(true);
      expect(record.po()?.notes).toBe('Mine.');
      expect(record.po()?.freight.minor).toBe(12_500);
    });

    it('says a line’s quantity must be whole where the SKU is counted in whole units', async () => {
      const draft = await draftWorth('standard', 1_000);
      const line = draft.lines()[0]!;
      if (line.precision === 0) {
        draft.setQuantity(line.skuId, 1.5);
        expect(draft.check()[lineKey(line.skuId, 'quantity')]).toBeDefined();
      }
    });
  });

  describe('the supplier (§65.1)', () => {
    it('does not offer an inactivation the backend would refuse for open orders', async () => {
      await signIn('maya-chen');
      const busy = (
        await api.suppliers.list({ pageSize: 25, sort: '-openPurchaseOrderCount', filter: { status: { eq: 'active' } } })
      ).data[0]!;
      const store = TestBed.inject(SupplierStore);
      await store.open(busy.id);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(store.blockingOrders()).toBeGreaterThan(0);
      expect(await store.setStatus('inactive')).toBe(false);
      expect(store.failure()?.code).toBe('SUPPLIER_HAS_OPEN_POS');
    });

    it('reads the scorecard against the median of the supplier’s own category', async () => {
      await signIn('marcus-lee');
      const supplier = await supplierOf('preferred');
      const store = TestBed.inject(SupplierStore);
      await store.open(supplier.id);
      for (let attempt = 0; attempt < 40 && store.peers().value === null; attempt += 1)
        await new Promise((resolve) => setTimeout(resolve, 25));
      const peers = store.peers().value!;
      expect(peers.category).toBe(supplier.category);
      expect(peers.count).toBeGreaterThan(1);
      expect(peers.onTimeBps).not.toBeNull();
    });
  });

  /**
   * Journey B (§20) whole: a CHI-01 position below its reorder point, a
   * purchase order from its preferred supplier worth an approval, the
   * procurement lead's decision, the send, a partial receipt with damaged and
   * rejected units, and the stock and the ledger that follow.
   */
  it('walks Journey B from a position below its reorder point to the stock it replenished', async () => {
    await signIn('marcus-lee');
    const draft = TestBed.inject(PurchaseOrderDraftStore);
    draft.reset();
    const positions = (
      await api.inventory.list({ pageSize: 100, filter: { warehouseId: { eq: CHI }, belowReorderPoint: { eq: true } } })
    ).data;
    let chosen: { skuId: string; supplier: string; suggested: string } | null = null;
    for (const position of positions) {
      if (!position.reorderSuggested) continue;
      const sku = (await api.catalog.skus({ pageSize: 25, filter: { id: { eq: position.skuId } } })).data[0]!;
      if (!sku.preferredSupplierId) continue;
      const supplier = (await api.suppliers.get(sku.preferredSupplierId)).supplier;
      if (supplier.status !== 'active' || supplier.relationshipTier === 'conditional') continue;
      if (supplier.supportedCurrencies[0] !== 'USD') continue;
      const mapped = (await api.suppliers.get(supplier.id)).mappings.some((mapping) => mapping.skuId === position.skuId);
      if (!mapped) continue;
      chosen = { skuId: position.skuId, supplier: supplier.id, suggested: position.suggestedQuantity };
      break;
    }
    expect(chosen).not.toBeNull();
    const before = (await api.inventory.list({ pageSize: 25, filter: { warehouseId: { eq: CHI }, skuId: { eq: chosen!.skuId } } })).data[0]!;

    await draft.prefill({ sku: chosen!.skuId, warehouse: CHI, quantity: chosen!.suggested, supplier: chosen!.supplier });
    expect(draft.lines().map((line) => line.skuId)).toEqual([chosen!.skuId]);
    // Enough units for US$30,000, so the submit waits on a Procurement Manager alone.
    const line = draft.lines()[0]!;
    const cost = line.unitCost ?? 1;
    const units = Math.max(4, Math.ceil(30_000 / cost));
    draft.setQuantity(line.skuId, units);
    expect(draft.approval()?.steps.map((step) => step.requiredRole)).toEqual(['procurement_manager']);
    const created = await draft.create(true);
    expect(created?.po.status).toBe('pending_approval');

    const record = TestBed.inject(PurchaseOrderStore);
    await signIn('procurement-lead');
    await record.open(created!.po.id);
    expect(await record.decide('approve', 'Within budget.')).toBe(true);
    expect(record.po()?.status).toBe('approved');

    await signIn('marcus-lee');
    await record.open(created!.po.id);
    expect(record.commands()).toContain('send');
    expect(await record.send()).toBe(true);
    expect(record.po()?.status).toBe('sent');
    const inbound = (await api.inventory.list({ pageSize: 25, filter: { warehouseId: { eq: CHI }, skuId: { eq: chosen!.skuId } } })).data[0]!;
    expect(milli(inbound.inbound)).toBe(milli(before.inbound) + units * 1_000);

    await signIn('jordan-wells');
    await record.open(created!.po.id);
    expect(record.commands()).toEqual(['receive']);
    const receipt = TestBed.inject(ReceiptDraftStore);
    receipt.forget();
    await receipt.start();
    receipt.patch(record.rows()[0]!.id, { accepted: 1, damaged: 1, rejected: 1 });
    expect(await receipt.receive()).toBe(true);
    expect(record.po()?.status).toBe('partially_received');

    const after = (await api.inventory.list({ pageSize: 25, filter: { warehouseId: { eq: CHI }, skuId: { eq: chosen!.skuId } } })).data[0]!;
    // Accepted and damaged enter on hand; the damaged move to their bucket; the rejected never enter.
    expect(milli(after.onHand)).toBe(milli(before.onHand) + 2_000);
    expect(milli(after.damaged)).toBe(milli(before.damaged) + 1_000);
    expect(milli(after.inbound)).toBe(milli(before.inbound) + (units - 3) * 1_000);
    const moved = await api.inventory.movements({ pageSize: 25, filter: { sourceEntityId: { eq: receipt.written()!.id } } });
    const link = movementSourceLink(moved.data[0]!.sourceEntityType, moved.data[0]!.sourceEntityId, (permission) =>
      TestBed.inject(SessionStore).can(permission),
    );
    expect(link?.path).toBe(`/procurement/receiving/${receipt.written()!.id}`);
  });
});
