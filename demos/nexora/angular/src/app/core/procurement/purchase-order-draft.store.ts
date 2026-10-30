import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import {
  fromUsd,
  type CurrencyCode,
  type NexoraApi,
  type PurchaseOrderListItem,
  type SkuListItem,
  type SupplierListItem,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { classify, fieldErrors, without, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import {
  checkLines,
  lineFromMapping,
  lineKey,
  linesInput,
  maxVarianceBps,
  lastAcceptedCosts,
  subtotalMinor,
  type PoDraftLine,
  type SupplierMapping,
} from './po-draft';
import { previewApproval, SUPPLIER_STATUS_LABEL } from './procurement.model';
import { PurchaseOrdersStore } from './purchase-orders.store';

/** The module's words for what `create` and `submit` can meet (§65.1, §65.6). */
export const PO_WORDS: Record<string, string> = {
  SUPPLIER_ON_HOLD: 'This supplier is not active, so it cannot receive purchase orders.',
  SUPPLIER_INACTIVE: 'This supplier is inactive, so it cannot receive purchase orders.',
  WAREHOUSE_CLOSED: 'That warehouse is closed and receives nothing.',
  SKU_DISCONTINUED: 'One of the SKUs is discontinued and can no longer be ordered.',
  STALE_VERSION: 'Someone else changed this purchase order while the page was open.',
  INVALID_STATE_TRANSITION: 'The purchase order is no longer in a state that allows this.',
  PO_QUANTITY_BELOW_RECEIVED:
    'Part of this order has been received, so it is closed short rather than cancelled.',
  OVER_RECEIPT_TOLERANCE:
    'A line goes more than 5% over what was ordered; only a holder of purchase_orders.approve can receive it, with a reason.',
  RECEIPT_EMPTY: 'Receive at least one unit on one line.',
  APPROVAL_ALREADY_DECIDED: 'Another approver decided this one a moment ago.',
  FORBIDDEN: 'Your role does not hold this command.',
};

/** What the SKUs of a supplier's mappings are counted in, and whether they can still be ordered. */
export interface MappedSku {
  readonly unit: string;
  readonly precision: number;
  readonly status: SkuListItem['status'];
  readonly standardCostMinor: number;
}

export async function readMappedSkus(
  api: NexoraApi,
  health: TransportHealth,
  skuIds: readonly string[],
): Promise<ReadonlyMap<string, MappedSku>> {
  const ids = [...new Set(skuIds)];
  const map = new Map<string, MappedSku>();
  for (let start = 0; start < ids.length; start += 100) {
    const chunk = ids.slice(start, start + 100);
    const answer = await health.read(
      () => api.catalog.skus({ pageSize: 100, filter: { id: { in: chunk } } }),
      null,
    );
    for (const sku of answer?.data ?? [])
      map.set(sku.id, {
        unit: sku.unitOfMeasure,
        precision: sku.quantityPrecision,
        status: sku.status,
        standardCostMinor: sku.standardCost.minor,
      });
  }
  return map;
}

/**
 * A purchase order being written (§65.3–§65.5): the supplier, the warehouse it
 * is bound for and what it buys. The draft lives here rather than in the page,
 * so leaving the form and coming back finds it (FM-05); the create empties it.
 *
 * What `submit` will ask for is computed as the reader types, by the policy
 * the backend runs, so the form says before the submit that an approval will
 * be needed and why (FM-11).
 */
@Injectable({ providedIn: 'root' })
export class PurchaseOrderDraftStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly list = inject(PurchaseOrdersStore);

  readonly supplier = signal<SupplierListItem | null>(null);
  readonly supplierQuery = signal('');
  readonly supplierOptions = signal<readonly SupplierListItem[]>([]);
  readonly searchingSuppliers = signal(false);
  readonly mappings = signal<readonly SupplierMapping[]>([]);
  readonly skus = signal<ReadonlyMap<string, MappedSku>>(new Map());
  readonly lastAccepted = signal<ReadonlyMap<string, number>>(new Map());
  /** True while the supplier's terms and last accepted costs are being read. */
  readonly readingSupplier = signal(false);

  readonly destinationWarehouseId = signal<string | null>(null);
  /** `YYYY-MM-DD`, or empty for the backend's default of ten business days. */
  readonly expectedDate = signal('');
  /** Major units of the order's currency. */
  readonly freight = signal<number | null>(null);
  readonly notes = signal('');
  readonly lines = signal<readonly PoDraftLine[]>([]);
  readonly lineQuery = signal('');

  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal<'draft' | 'submit' | null>(null);

  /** The query that last filled the draft, so returning to the same link does not fill it twice. */
  private prefilled: string | null = null;
  /** A SKU asked for before a supplier was chosen: it joins the lines once one is. */
  private pendingSku: { skuId: string; quantity: number | null } | null = null;
  private ticket = 0;

  /** §65.3: the order is in the supplier's first currency. */
  readonly currency = computed<CurrencyCode>(
    () => this.supplier()?.supportedCurrencies[0] ?? 'USD',
  );

  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });

  /** §65.1: an on-hold or inactive supplier receives no order; said when it is chosen, not when it is refused. */
  readonly supplierRefusal = computed(() => {
    const supplier = this.supplier();
    if (supplier === null || supplier.status === 'active') return null;
    return `${supplier.displayName} is ${SUPPLIER_STATUS_LABEL[supplier.status].toLowerCase()} and cannot receive purchase orders.`;
  });

  /** §89.15: a closed warehouse receives nothing, so it is not offered. */
  readonly destinations = computed(() =>
    this.warehouses.rows().filter((row) => row.status !== 'closed'),
  );

  readonly freightMinor = computed(() => Math.round((this.freight() ?? 0) * 100));
  readonly subtotal = computed(() => subtotalMinor(this.lines()));

  /** The mappings not yet on the draft, filtered by what the reader typed. */
  readonly lineOptions = computed(() => {
    const query = this.lineQuery().trim().toLowerCase();
    const taken = new Set(this.lines().map((line) => line.skuId));
    return this.mappings()
      .filter((mapping) => !taken.has(mapping.skuId) && mapping.status === 'active')
      .filter(
        (mapping) =>
          query.length === 0 ||
          mapping.skuCode.toLowerCase().includes(query) ||
          mapping.skuName.toLowerCase().includes(query) ||
          mapping.supplierSku.toLowerCase().includes(query),
      )
      .slice(0, 50);
  });

  /**
   * What `submit` will ask for. It reads the cost, so a reader without
   * `cost.view` is given the rule in words instead (FM-11, PM-01).
   */
  readonly approval = computed(() => {
    const supplier = this.supplier();
    if (supplier === null || !this.canSeeCost() || this.lines().length === 0) return null;
    return previewApproval({
      subtotalMinor: this.subtotal(),
      freightMinor: this.freightMinor(),
      currency: this.currency(),
      conditional: supplier.relationshipTier === 'conditional',
      maxVarianceBps: maxVarianceBps(this.lines()),
    });
  });

  readonly empty = computed(
    () =>
      this.supplier() === null &&
      this.lines().length === 0 &&
      this.destinationWarehouseId() === null &&
      this.notes().trim() === '',
  );

  /**
   * A purchase order opened from a stock position below its reorder point
   * arrives with the SKU, the warehouse, the suggested quantity and the SKU's
   * preferred supplier. The same link opened again leaves the draft as the
   * reader left it (FM-05).
   */
  async prefill(params: {
    sku: string | null;
    warehouse: string | null;
    quantity: string | null;
    supplier: string | null;
  }): Promise<void> {
    await this.warehouses.open();
    const key = JSON.stringify(params);
    if (params.sku === null && params.warehouse === null && params.supplier === null) return;
    if (key === this.prefilled) return;
    this.prefilled = key;
    this.reset(false);
    if (params.warehouse !== null && this.destinations().some((row) => row.id === params.warehouse))
      this.destinationWarehouseId.set(params.warehouse);
    const quantity = params.quantity === null ? null : Number(params.quantity);
    if (params.sku !== null)
      this.pendingSku = {
        skuId: params.sku,
        quantity: quantity !== null && Number.isFinite(quantity) && quantity > 0 ? quantity : null,
      };
    if (params.supplier !== null) {
      const api = await this.backend.ready();
      const detail = await this.health.read(() => api.suppliers.get(params.supplier!), null);
      if (detail) await this.chooseSupplier(detail.supplier);
    }
  }

  async searchSuppliers(query: string): Promise<void> {
    this.supplierQuery.set(query);
    const ticket = ++this.ticket;
    if (query.trim().length < 2) {
      this.supplierOptions.set([]);
      return;
    }
    this.searchingSuppliers.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.suppliers.list({ q: query.trim(), pageSize: 25, sort: 'displayName' }),
        null,
      );
      if (ticket !== this.ticket || answer === null) return;
      this.supplierOptions.set(answer.data);
    } finally {
      if (ticket === this.ticket) this.searchingSuppliers.set(false);
    }
  }

  /** A new supplier empties the lines: their prices and terms were the other supplier's. */
  async chooseSupplier(supplier: SupplierListItem | null): Promise<void> {
    if (supplier?.id === this.supplier()?.id) return;
    this.supplier.set(supplier);
    this.supplierQuery.set(supplier?.displayName ?? '');
    this.lines.set([]);
    this.mappings.set([]);
    this.skus.set(new Map());
    this.lastAccepted.set(new Map());
    this.errors.set(without(this.errors(), 'supplierId', 'lines'));
    if (supplier === null) return;
    this.readingSupplier.set(true);
    try {
      const api = await this.backend.ready();
      const detail = await this.health.read(() => api.suppliers.get(supplier.id), null);
      if (this.supplier()?.id !== supplier.id || detail === null) return;
      const skus = await readMappedSkus(api, this.health, [
        ...detail.mappings.map((mapping) => mapping.skuId),
        ...(this.pendingSku ? [this.pendingSku.skuId] : []),
      ]);
      const last = lastAcceptedCosts(detail.mappings);
      if (this.supplier()?.id !== supplier.id) return;
      this.mappings.set(detail.mappings);
      this.skus.set(skus);
      this.lastAccepted.set(last);
      const pending = this.pendingSku;
      this.pendingSku = null;
      if (pending) await this.addSku(pending.skuId, pending.quantity);
    } finally {
      this.readingSupplier.set(false);
    }
  }

  /**
   * Adds a SKU the supplier maps on its own terms; a SKU the supplier does not
   * map (a position's SKU whose preferred supplier was changed) is added at the
   * backend's default price, its standard cost in the order's currency.
   */
  async addSku(skuId: string, quantity: number | null = null): Promise<void> {
    if (this.lines().some((line) => line.skuId === skuId)) return;
    const mapping = this.mappings().find((candidate) => candidate.skuId === skuId);
    const facts = this.skus().get(skuId);
    const last = this.lastAccepted().get(skuId) ?? null;
    if (mapping) {
      const line = lineFromMapping(mapping, this.currency(), facts, last, quantity);
      // `buildLines` prices a mapping in another currency at the SKU's standard cost, converted.
      const unitCost =
        line.unitCost === null && facts && this.canSeeCost()
          ? fromUsd({ currency: 'USD', minor: facts.standardCostMinor }, this.currency()).minor / 100
          : line.unitCost;
      this.lines.update((lines) => [...lines, { ...line, unitCost }]);
    } else {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.catalog.skus({ pageSize: 25, filter: { id: { eq: skuId } } }),
        null,
      );
      const sku = answer?.data[0];
      if (!sku) return;
      this.lines.update((lines) => [
        ...lines,
        {
          skuId,
          skuCode: sku.sku,
          skuName: sku.name,
          unit: sku.unitOfMeasure,
          precision: sku.quantityPrecision,
          quantity,
          unitCost: this.canSeeCost()
            ? fromUsd(sku.standardCost, this.currency()).minor / 100
            : null,
          minimumOrderQuantity: null,
          packMultiple: null,
          leadTimeDays: null,
          lastAcceptedMinor: last,
        },
      ]);
    }
    this.lineQuery.set('');
    this.errors.set(without(this.errors(), 'lines'));
  }

  setQuantity(skuId: string, quantity: number | null): void {
    this.patchLine(skuId, { quantity });
    this.errors.set(without(this.errors(), lineKey(skuId, 'quantity'), 'lines'));
  }

  setUnitCost(skuId: string, unitCost: number | null): void {
    this.patchLine(skuId, { unitCost });
    this.errors.set(without(this.errors(), lineKey(skuId, 'unitCost')));
  }

  remove(skuId: string): void {
    this.lines.update((lines) => lines.filter((line) => line.skuId !== skuId));
  }

  private patchLine(skuId: string, patch: Partial<PoDraftLine>): void {
    this.lines.update((lines) =>
      lines.map((line) => (line.skuId === skuId ? { ...line, ...patch } : line)),
    );
  }

  reset(forgetPrefill = true): void {
    this.supplier.set(null);
    this.supplierQuery.set('');
    this.supplierOptions.set([]);
    this.mappings.set([]);
    this.skus.set(new Map());
    this.lastAccepted.set(new Map());
    this.destinationWarehouseId.set(null);
    this.expectedDate.set('');
    this.freight.set(null);
    this.notes.set('');
    this.lines.set([]);
    this.lineQuery.set('');
    this.errors.set({});
    this.failure.set(null);
    this.pendingSku = null;
    if (forgetPrefill) this.prefilled = null;
  }

  /** The rules the backend enforces, said at the control before the command is sent. */
  check(): FormErrors {
    const errors: Record<string, string[]> = {};
    if (this.supplier() === null) errors['supplierId'] = ['Choose the supplier the order goes to.'];
    else if (this.supplierRefusal()) errors['supplierId'] = [this.supplierRefusal()!];
    const destination = this.destinationWarehouseId();
    if (destination === null)
      errors['destinationWarehouseId'] = ['Choose the warehouse the goods are delivered to.'];
    else if (!this.destinations().some((row) => row.id === destination))
      errors['destinationWarehouseId'] = [PO_WORDS['WAREHOUSE_CLOSED']!];
    Object.assign(errors, checkLines(this.lines()));
    for (const line of this.lines())
      if (this.skus().get(line.skuId)?.status === 'discontinued')
        errors[lineKey(line.skuId, 'quantity')] = [`${line.skuCode} is discontinued and can no longer be ordered.`];
    if ((this.freight() ?? 0) < 0) errors['freightMinor'] = ['Freight is never below zero.'];
    return errors;
  }

  /**
   * Writes the draft, and submits it when asked. A submit refused after the
   * draft was written leaves the draft in place: the answer says both.
   */
  async create(
    submit: boolean,
  ): Promise<{ po: PurchaseOrderListItem; submitFailure: InventoryFailure | null } | null> {
    const supplier = this.supplier();
    const destination = this.destinationWarehouseId();
    if (this.creating() !== null) return null;
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0 || supplier === null || destination === null) return null;
    this.creating.set(submit ? 'submit' : 'draft');
    try {
      const api = await this.backend.ready();
      const detail = await this.health.mutation(() =>
        api.purchaseOrders.create({
          supplierId: supplier.id,
          destinationWarehouseId: destination,
          lines: linesInput(this.lines()),
          ...(this.expectedDate() ? { expectedDate: this.expectedDate() } : {}),
          ...(this.freight() === null ? {} : { freightMinor: this.freightMinor() }),
          ...(this.notes().trim() ? { notes: this.notes().trim() } : {}),
        }),
      );
      let po = detail.purchaseOrder;
      let submitFailure: InventoryFailure | null = null;
      if (submit) {
        const version = po.metadata.version;
        try {
          po = (
            await this.health.mutation(() =>
              api.purchaseOrders.submit(po.id, { ifMatch: version }),
            )
          ).purchaseOrder;
        } catch (error) {
          submitFailure = classify(error, PO_WORDS, 'The draft was written and not submitted.');
        }
      }
      this.reset();
      if (this.list.total() !== null) void this.list.reload();
      return { po, submitFailure };
    } catch (error) {
      const failure = classify(error, PO_WORDS, 'The purchase order was not written.');
      const byField = fieldErrors(error);
      if (isApiError(error, 'SUPPLIER_ON_HOLD') || isApiError(error, 'SUPPLIER_INACTIVE'))
        byField['supplierId'] = [failure.message];
      if (isApiError(error, 'WAREHOUSE_CLOSED')) byField['destinationWarehouseId'] = [failure.message];
      if (isApiError(error, 'VALIDATION_FAILED') && Object.keys(byField).length === 0)
        byField['lines'] = [error.message];
      this.errors.set(byField);
      this.failure.set(failure);
      return null;
    } finally {
      this.creating.set(null);
    }
  }
}
