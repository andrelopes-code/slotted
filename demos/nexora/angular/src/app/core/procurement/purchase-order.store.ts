import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ratioBps,
  type NexoraApi,
  type PurchaseOrderDetail,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { classify, INVENTORY_CONFLICTS, type InventoryFailure } from '../inventory/inventory-failure';
import { milli } from '../inventory/inventory.model';
import { SessionStore } from '../session/session.store';
import { lastAcceptedCosts } from './po-draft';
import { previewApproval, RECEIVABLE } from './procurement.model';
import { PO_WORDS, readMappedSkus, type MappedSku } from './purchase-order-draft.store';
import { PurchaseOrdersStore } from './purchase-orders.store';
import { ReceivingStore } from './receiving.store';

export type PurchaseOrderLine = PurchaseOrderDetail['lines'][number];

/** A line with what its SKU is counted in. */
export interface PurchaseOrderLineRow extends PurchaseOrderLine {
  readonly unit: string;
  readonly precision: number;
  /** Accepted, damaged and rejected together: everything that came through the door for the line. */
  readonly receivedTotal: string;
}

export type PurchaseOrderBusy =
  | 'submit'
  | 'send'
  | 'acknowledge'
  | 'cancel'
  | 'close'
  | 'decision'
  | 'receive'
  | 'save';

export type PurchaseOrderCommand =
  | 'edit'
  | 'submit'
  | 'send'
  | 'acknowledge'
  | 'receive'
  | 'cancel'
  | 'close';

/**
 * One purchase order (§65): its lines and what is still to come, its
 * receipts, its approval, and the commands the reader's permissions allow in
 * its state. Every command carries the version the page read, held as a
 * number (ER-03); a refusal is classed before it is shown (ER-01), and a
 * conflict reads the order again (ER-02).
 */
@Injectable({ providedIn: 'root' })
export class PurchaseOrderStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly list = inject(PurchaseOrdersStore);
  private readonly queue = inject(ReceivingStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<PurchaseOrderDetail | null>(null);
  readonly skus = signal<ReadonlyMap<string, MappedSku>>(new Map());
  /** The supplier's last accepted costs, read for a draft whose submit the page previews. */
  readonly lastAccepted = signal<ReadonlyMap<string, number> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<PurchaseOrderBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  private sequence = 0;
  private version = 0;
  private approvalVersion = 0;

  readonly po = computed(() => this.detail()?.purchaseOrder ?? null);
  readonly supplier = computed(() => this.detail()?.supplier ?? null);
  readonly approvalRequest = computed(() => this.detail()?.approval ?? null);
  readonly receipts = computed(() =>
    [...(this.detail()?.receipts ?? [])].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
  );

  readonly rows = computed<readonly PurchaseOrderLineRow[]>(() => {
    const skus = this.skus();
    return (this.detail()?.lines ?? []).map((line) => {
      const sku = skus.get(line.skuId);
      return {
        ...line,
        unit: sku?.unit ?? '',
        precision: sku?.precision ?? 0,
        receivedTotal: String(
          (milli(line.receivedAcceptedQuantity) +
            milli(line.receivedDamagedQuantity) +
            milli(line.rejectedQuantity)) /
            1000,
        ),
      };
    });
  });

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  readonly canSeeCost = computed(() => this.can('cost.view'));
  readonly canSeeSuppliers = computed(() => this.can('suppliers.view'));
  readonly canReadReceipts = computed(() => this.can('receipts.view'));

  /** §65.7: something accepted or damaged has entered the stock, so the order is closed short, never cancelled. */
  readonly hasReceived = computed(() =>
    this.rows().some(
      (row) => milli(row.receivedAcceptedQuantity) + milli(row.receivedDamagedQuantity) > 0,
    ),
  );

  /** `receipts.create` is checked at the destination warehouse. */
  readonly canReceive = computed(() => {
    const po = this.po();
    return (
      po !== null &&
      RECEIVABLE.includes(po.status) &&
      this.can('receipts.create') &&
      this.warehouses.covers(po.destinationWarehouseId)
    );
  });

  /** The commands this state allows and this reader holds, in the order they are read (RP-09). */
  readonly commands = computed<readonly PurchaseOrderCommand[]>(() => {
    const po = this.po();
    const supplier = this.supplier();
    if (po === null) return [];
    const commands: PurchaseOrderCommand[] = [];
    switch (po.status) {
      case 'draft':
        if (this.can('purchase_orders.submit') && supplier?.status === 'active') commands.push('submit');
        if (this.can('purchase_orders.edit')) commands.push('edit');
        break;
      case 'approved':
        if (this.can('purchase_orders.send')) commands.push('send');
        if (this.can('purchase_orders.edit')) commands.push('edit');
        break;
      case 'sent':
        if (this.canReceive()) commands.push('receive');
        if (this.can('purchase_orders.edit')) commands.push('acknowledge');
        break;
      case 'acknowledged':
      case 'partially_received':
        if (this.canReceive()) commands.push('receive');
        break;
    }
    const open = po.status !== 'received' && po.status !== 'closed' && po.status !== 'cancelled';
    if (open && !this.hasReceived() && this.can('purchase_orders.cancel')) commands.push('cancel');
    if (this.hasReceived() && RECEIVABLE.includes(po.status) && this.can('purchase_orders.approve'))
      commands.push('close');
    return commands;
  });

  /** The largest unit-cost rise of a line against the last accepted cost, in basis points. */
  readonly maxVarianceBps = computed(() => {
    const last = this.lastAccepted();
    if (last === null) return 0;
    return this.rows().reduce((max, row) => {
      const previous = last.get(row.skuId);
      return previous ? Math.max(max, ratioBps(row.unitCost.minor - previous, previous)) : max;
    }, 0);
  });

  /** What `submit` will ask for, previewed on a draft for a reader who may see its cost (FM-11). */
  readonly submitPreview = computed(() => {
    const po = this.po();
    const supplier = this.supplier();
    if (po === null || supplier === null || po.status !== 'draft' || !this.canSeeCost()) return null;
    return previewApproval({
      subtotalMinor: po.subtotal.minor,
      freightMinor: po.freight.minor,
      currency: po.currency,
      fxRateToUsd: po.fxRateToUsd,
      conditional: supplier.relationshipTier === 'conditional',
      maxVarianceBps: this.maxVarianceBps(),
    });
  });

  /** The version the page read, for the edit and the receipt that travel beside the record's own commands. */
  readVersion(): number {
    return this.version;
  }

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.skus.set(new Map());
      this.lastAccepted.set(null);
      this.error.set(null);
      this.failure.set(null);
    }
    await Promise.all([this.warehouses.open(), this.load()]);
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.purchaseOrders.get(id);
      if (ticket !== this.sequence) return;
      // The record and its units land together, so a line is never drawn without the unit it is counted in.
      const [skus, last] = await Promise.all([
        readMappedSkus(api, this.health, detail.lines.map((line) => line.skuId)),
        // The supplier's mappings state the unit cost last accepted, which the submit's preview measures.
        detail.purchaseOrder.status === 'draft' && this.canSeeCost() && this.can('suppliers.view')
          ? this.health
              .read(() => api.suppliers.get(detail.purchaseOrder.supplierId), null)
              .then((supplier) => (supplier ? lastAcceptedCosts(supplier.mappings) : null))
          : Promise.resolve(null),
      ]);
      if (ticket !== this.sequence) return;
      this.version = detail.purchaseOrder.metadata.version;
      this.approvalVersion = detail.approval?.metadata.version ?? 0;
      this.skus.set(skus);
      this.lastAccepted.set(last);
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The purchase order could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  submit(): Promise<boolean> {
    return this.run('submit', (api, id, version) =>
      api.purchaseOrders.submit(id, { ifMatch: version }),
    );
  }

  send(): Promise<boolean> {
    return this.run('send', (api, id, version) => api.purchaseOrders.send(id, { ifMatch: version }));
  }

  /** The supplier confirmed the order, with the date they committed to when it moved (§65.6). */
  acknowledge(expectedDate: string): Promise<boolean> {
    return this.run('acknowledge', (api, id, version) =>
      api.purchaseOrders.acknowledge(
        id,
        expectedDate ? { expectedDate } : {},
        { ifMatch: version },
      ),
    );
  }

  cancel(reason: string): Promise<boolean> {
    return this.run('cancel', (api, id, version) =>
      api.purchaseOrders.cancel(id, { reason }, { ifMatch: version }),
    );
  }

  closeShort(reason: string): Promise<boolean> {
    return this.run('close', (api, id, version) =>
      api.purchaseOrders.closeShort(id, { reason }, { ifMatch: version }),
    );
  }

  /** The approval of this order, decided from the order itself (§67). */
  async decide(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<boolean> {
    const approval = this.approvalRequest();
    if (approval === null || this.busy() !== null) return false;
    this.busy.set('decision');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const version = this.approvalVersion;
      await this.health.mutation(() => {
        if (decision === 'approve')
          return api.approvals.approve(approval.id, reason ? { comment: reason } : {}, { ifMatch: version });
        if (decision === 'reject') return api.approvals.reject(approval.id, { reason }, { ifMatch: version });
        return api.approvals.requestChanges(approval.id, { reason }, { ifMatch: version });
      });
      await this.load();
      this.refreshLists();
      return true;
    } catch (error) {
      this.failure.set(classify(error, PO_WORDS, 'The decision was not recorded.'));
      await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  /**
   * Runs a command the page holds beside the record — the edit, the receipt —
   * with the version the page read, and reads the order back on success.
   */
  async write<T>(
    kind: PurchaseOrderBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<T>,
  ): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
    const po = this.po();
    if (po === null || this.busy() !== null) return { ok: false, error: null };
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const value = await this.health.mutation(() => action(api, po.id, this.version));
      await this.load();
      this.refreshLists();
      return { ok: true, value };
    } catch (error) {
      if (isApiError(error) && (INVENTORY_CONFLICTS.has(error.code) || error.code === 'INVALID_STATE_TRANSITION'))
        await this.load();
      return { ok: false, error };
    } finally {
      this.busy.set(null);
    }
  }

  private async run(
    kind: PurchaseOrderBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const result = await this.write(kind, action);
    if (result.ok) return true;
    if (result.error !== null)
      this.failure.set(classify(result.error, PO_WORDS, 'The purchase order was not changed.'));
    return false;
  }

  private refreshLists(): void {
    if (this.list.total() !== null) void this.list.reload();
    if (this.queue.total() !== null) void this.queue.reload();
  }
}
