import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NexoraApiError, type NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { stockColumns, stockFilterFields } from '../../pages/inventory/stock-columns';
import { movementSourceLabel } from '../catalog/catalog.model';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { CycleCountStore } from './cycle-count.store';
import { movementSourceLink } from './inventory.model';
import { OverviewStore } from './overview.store';
import { PositionStore } from './position.store';
import { PositionsStore } from './positions.store';
import { TransferStore } from './transfer.store';

const CHI = 'wh_000001';
const DAL = 'wh_000002';
/** §82.7: the MX-240 servo motor, nothing available in CHI-01 and a PO on its way. */
const MX240 = 'sku_000001';

describe('the inventory module', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const can = (permissions: readonly string[]) => (permission: string) =>
    permissions.includes(permission);

  describe('cost under permissions (PM-01)', () => {
    it('leaves the value out of the stock list for a reader without cost.view', () => {
      const withCost = stockColumns(can(['inventory.view', 'cost.view'])).map((column) => column.id);
      const without = stockColumns(can(['inventory.view'])).map((column) => column.id);
      expect(withCost).toContain('onHandValue');
      expect(without).not.toContain('onHandValue');
      const fields = stockFilterFields(can(['inventory.view']), []).map((field) => field.key);
      expect(fields).not.toContain('onHandValue');
    });

    it('never reads the cost GET /inventory hands a representative, though the backend sends it', async () => {
      await signIn('noah-bennett');
      const store = TestBed.inject(PositionStore);
      await store.open(MX240, CHI);
      // The leak the ledger records: the list item carries a cost for every reader.
      expect(store.positions()![0]!.standardCost.minor).toBeGreaterThan(0);
      expect(store.canSeeCost()).toBe(false);
      expect(store.unitCostMinor()).toBeNull();
    });

    it('shows a buyer the cost the catalogue states', async () => {
      await signIn('marcus-lee');
      const store = TestBed.inject(PositionStore);
      await store.open(MX240, CHI);
      expect(store.unitCostMinor()).toBeGreaterThan(0);
    });
  });

  describe('warehouse scope (§82.33)', () => {
    it('gives Jordan Wells CHI-01 and nothing else, though GET /warehouses answers six', async () => {
      await signIn('jordan-wells');
      const warehouses = TestBed.inject(WarehousesStore);
      await warehouses.open();
      expect(warehouses.rows().length).toBeGreaterThan(1);
      expect(warehouses.inScope().map((row) => row.code)).toEqual(['CHI-01']);
    });

    it('lists only CHI-01 positions to Jordan', async () => {
      await signIn('jordan-wells');
      const store = TestBed.inject(PositionsStore);
      await store.open();
      expect(store.rows().length).toBeGreaterThan(0);
      expect(new Set(store.rows().map((row) => row.warehouseId))).toEqual(new Set([CHI]));
    });

    it('refuses Jordan a transfer that neither leaves nor reaches CHI-01, though GET /transfers/:id answers it', async () => {
      await signIn('jordan-wells');
      const store = TestBed.inject(TransferStore);
      await store.open('trf_000002'); // DEN-01 → DAL-01
      expect(store.transfer()).not.toBeNull();
      expect(store.outOfScope()).toBe(true);
    });

    it('reads the overview of one warehouse for Jordan', async () => {
      await signIn('jordan-wells');
      const store = TestBed.inject(OverviewStore);
      await store.open();
      expect(store.byWarehouse().value!.map((row) => row.code)).toEqual(['CHI-01']);
      expect(store.single()?.code).toBe('CHI-01');
    });
  });

  describe('the adjustment (§60.7)', () => {
    beforeEach(() => signIn('maya-chen'));

    it('asks for a note from ten units, before the backend does', async () => {
      const store = TestBed.inject(PositionStore);
      await store.open('sku_000004', CHI);
      store.patch({ direction: 'add', quantity: 12, reason: 'found_stock' });
      expect(store.noteRequired()).toBe(true);
      expect(store.check()['note']).toBeDefined();
      store.patch({ note: 'Found on the mezzanine during the audit.' });
      expect(store.check()['note']).toBeUndefined();
    });

    it('says a damaged unit leaves on hand where it is and moves to the damaged bucket', async () => {
      const store = TestBed.inject(PositionStore);
      await store.open('sku_000004', CHI);
      const row = store.selected()!;
      store.patch({ direction: 'remove', quantity: 1, reason: 'damage' });
      expect(store.isDamage()).toBe(true);
      expect(store.preview()!.onHand).toBe(row.onHand);
      expect(Number(store.preview()!.damaged)).toBe(Number(row.damaged) + 1);
    });

    it('refuses zero and more than the sellable stock at the control', async () => {
      const store = TestBed.inject(PositionStore);
      await store.open('sku_000004', CHI);
      store.patch({ direction: 'remove', quantity: 0, reason: 'count_correction' });
      expect(store.check()['quantityDelta']).toBeDefined();
      store.patch({ quantity: Number(store.removable()) + 1 });
      expect(store.check()['quantityDelta']![0]).toContain('sellable');
    });

    it('writes the movement into the ledger and finds it there', async () => {
      const store = TestBed.inject(PositionStore);
      await store.open('sku_000004', CHI);
      const before = Number(store.selected()!.onHand);
      store.patch({ direction: 'add', quantity: 2, reason: 'found_stock' });
      expect(await store.adjust()).toBe(true);
      expect(Number(store.selected()!.onHand)).toBe(before + 2);
      expect(store.written()?.sourceEntityType).toBe('manual_adjustment');
      expect(store.ledger()[0]!.id).toBe(store.written()!.id);
      expect(Number(store.ledger()[0]!.balanceAfter)).toBe(before + 2);
    });

    it('rolls the position back when the transport fails, and says nothing was changed (§33)', async () => {
      const store = TestBed.inject(PositionStore);
      await store.open('sku_000004', CHI);
      const before = store.selected()!.onHand;
      vi.spyOn(api.inventory, 'adjust').mockRejectedValueOnce(
        new NexoraApiError('SERVICE_UNAVAILABLE', 'down', { status: 503 }),
      );
      store.patch({ direction: 'add', quantity: 2, reason: 'found_stock' });
      expect(await store.adjust()).toBe(false);
      expect(store.selected()!.onHand).toBe(before);
      expect(store.failure()?.kind).toBe('transport');
    });

    it('offers no adjustment to a reader without inventory.adjust', async () => {
      await signIn('jordan-wells');
      const store = TestBed.inject(PositionStore);
      await store.open('sku_000004', CHI);
      expect(store.canAdjust()).toBe(false);
    });
  });

  describe('transfers (§61)', () => {
    beforeEach(() => signIn('maya-chen'));

    async function draft(): Promise<string> {
      const stock = await api.inventory.list({
        pageSize: 25,
        sort: '-available',
        filter: { warehouseId: { eq: CHI }, available: { gte: 20 } },
      });
      const sku = stock.data.find((row) => row.unitOfMeasure === 'EA')!;
      const detail = await api.inventory.transfers.create({
        sourceWarehouseId: CHI,
        destinationWarehouseId: DAL,
        lines: [{ skuId: sku.skuId, quantity: '10' }],
      });
      return detail.transfer.id;
    }

    it('refuses to cancel a transfer after anything has shipped', async () => {
      const store = TestBed.inject(TransferStore);
      await store.open('trf_000009'); // partly received
      expect(store.canMoveAtSource()).toBe(true);
      expect(await store.cancel()).toBe(false);
      expect(store.failure()?.kind).toBe('state');
    });

    it('answers a version someone else moved past by reading the transfer again (ER-02, ER-03)', async () => {
      const store = TestBed.inject(TransferStore);
      const id = await draft();
      await store.open(id);
      // Another writer marks it ready while the page still holds the draft.
      await api.inventory.transfers.ready(id, { ifMatch: 1 });
      expect(await store.cancel()).toBe(false);
      expect(store.failure()?.code).toBe('STALE_VERSION');
      expect(store.failure()?.kind).toBe('conflict');
      expect(store.transfer()?.status).toBe('ready');
    });

    it('receives in part with damaged units, and reports the partial success', async () => {
      const store = TestBed.inject(TransferStore);
      const id = await draft();
      await store.open(id);
      expect(await store.markReady()).toBe(true);
      expect(await store.ship()).toBe(true);
      store.startReceipt();
      const line = store.rows()[0]!;
      store.patchReceipt(line.id, { quantity: 6, damaged: 2 });
      expect(await store.receive()).toBe(true);
      expect(store.transfer()?.status).toBe('partially_received');
      expect(store.received()).toEqual({ complete: 0, partial: 1, damaged: 1 });
      expect(store.rows()[0]!.outstanding).toBe('4');
      const moved = await api.inventory.movements({ filter: { sourceEntityId: { eq: id } } });
      const into = moved.data.find((movement) => movement.type === 'transfer_in')!;
      expect(into.damagedDelta).toBe('2');
    });

    it('keeps a receipt larger than what is outstanding at the line', async () => {
      const store = TestBed.inject(TransferStore);
      const id = await draft();
      await store.open(id);
      await store.markReady();
      await store.ship();
      store.startReceipt();
      const line = store.rows()[0]!;
      store.patchReceipt(line.id, { quantity: 11 });
      expect(await store.receive()).toBe(false);
      expect(store.receiptErrors()[`received.${line.id}.quantity`]).toBeDefined();
    });
  });

  describe('cycle counts (§62)', () => {
    async function counting(persona: string): Promise<CycleCountStore> {
      await signIn('maya-chen');
      const stock = await api.inventory.list({
        pageSize: 25,
        sort: '-onHandValue',
        filter: { warehouseId: { eq: CHI }, onHand: { gte: 5 } },
      });
      const created = await api.inventory.cycleCounts.create({
        warehouseId: CHI,
        plannedDate: '2026-09-04',
        skuIds: stock.data.slice(0, 2).map((row) => row.skuId),
      });
      await signIn(persona);
      const store = TestBed.inject(CycleCountStore);
      await store.open(created.cycleCount.id);
      expect(await store.start()).toBe(true);
      return store;
    }

    it('asks for an approval when the variance is worth US$2,500 or more, and offers no Complete meanwhile', async () => {
      const store = await counting('maya-chen');
      for (const row of store.rows()) store.patch(row.id, { quantity: 0 });
      expect(store.needsApproval()).toBe(true);
      expect(await store.submit()).toBe(true);
      expect(store.count()?.status).toBe('submitted');
      expect(store.approval()?.status).toBe('pending');
      expect(store.approval()?.steps[0]?.requiredRole).toBe('warehouse_manager');
      expect(store.completable()).toBe(false);
    });

    it('tells a counter without cost.view the rule and not the figure', async () => {
      const store = await counting('jordan-wells');
      expect(store.canCount()).toBe(true);
      for (const row of store.rows()) store.patch(row.id, { quantity: 0 });
      expect(store.impactMinor()).toBeNull();
    });

    it('requires every line before the count is submitted', async () => {
      const store = await counting('jordan-wells');
      store.patch(store.rows()[0]!.id, { quantity: 1 });
      expect(await store.submit()).toBe(false);
      expect(Object.keys(store.errors()).length).toBe(1);
    });
  });

  describe('the ledger’s words', () => {
    it('names every source the backend writes and never shows a raw type', () => {
      expect(movementSourceLabel('manual_adjustment')).toBe('Manual adjustment');
      expect(movementSourceLabel('return')).toBe('Customer return');
      expect(movementSourceLabel('something_new')).toBe('Another record');
    });

    it('leads a source to its record, or to what it moved where it has no screen', () => {
      expect(movementSourceLink('transfer', 'trf_1')?.path).toBe('/inventory/transfers/trf_1');
      expect(movementSourceLink('shipment', 'shp_1')).toEqual({
        path: '/inventory/movements',
        queryParams: { source: 'shp_1' },
      });
      expect(movementSourceLink('opening_balance', 'x')).toBeNull();
    });

    it('leads a goods receipt to its record for a reader who may open one, and to the ledger otherwise', () => {
      const receipts = (permission: string) => permission === 'receipts.view';
      expect(movementSourceLink('goods_receipt', 'grn_1', receipts)?.path).toBe('/procurement/receiving/grn_1');
      expect(movementSourceLink('goods_receipt', 'grn_1')).toEqual({
        path: '/inventory/movements',
        queryParams: { source: 'grn_1' },
      });
      expect(movementSourceLink('purchase_order', 'po_1', () => true)?.path).toBe(
        '/procurement/purchase-orders/po_1',
      );
    });
  });
});
