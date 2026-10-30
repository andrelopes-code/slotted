import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { PurchaseOrderDetail, PurchaseOrderInput } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { formatDate, formatMoney, formatQuantity } from '../catalog/catalog.model';
import { classify, fieldErrors, without, type InventoryFailure } from '../inventory/inventory-failure';
import {
  checkLines,
  lineFromMapping,
  lineKey,
  linesInput,
  type PoDraftLine,
  type SupplierMapping,
} from './po-draft';
import { PO_WORDS, readMappedSkus, type MappedSku } from './purchase-order-draft.store';
import { PurchaseOrderStore } from './purchase-order.store';

export interface PoEditDraft {
  destinationWarehouseId: string;
  expectedDate: string;
  /** Major units of the order's currency. */
  freight: number;
  notes: string;
  lines: readonly PoDraftLine[];
}

/** One field two people wrote at the same time (FM-08). */
export interface PoConflictField {
  readonly label: string;
  readonly theirs: string;
  readonly mine: string | null;
}

function draftOf(detail: PurchaseOrderDetail, skus: ReadonlyMap<string, MappedSku>): PoEditDraft {
  const po = detail.purchaseOrder;
  return {
    destinationWarehouseId: po.destinationWarehouseId,
    expectedDate: po.expectedDate,
    freight: po.freight.minor / 100,
    notes: po.notes ?? '',
    lines: detail.lines.map((line) => ({
      skuId: line.skuId,
      skuCode: line.skuCode,
      skuName: line.skuName,
      unit: skus.get(line.skuId)?.unit ?? '',
      precision: skus.get(line.skuId)?.precision ?? 0,
      quantity: Number(line.orderedQuantity),
      unitCost: line.unitCost.minor / 100,
      minimumOrderQuantity: null,
      packMultiple: null,
      leadTimeDays: null,
      lastAcceptedMinor: null,
    })),
  };
}

const linesText = (lines: readonly PoDraftLine[]): string =>
  lines.map((line) => `${line.skuCode} × ${line.quantity ?? 0} at ${line.unitCost ?? '—'}`).join('; ');

const sameLines = (a: readonly PoDraftLine[], b: readonly PoDraftLine[]): boolean =>
  linesText(a) === linesText(b);

/**
 * The order's terms and lines, edited where they are read (FM-07) — a draft
 * freely, an approved order with its approval at stake (§65.6). The command
 * carries the fields that moved since the form opened (FM-09), and a version
 * someone else moved past is answered field by field (FM-08).
 */
@Injectable({ providedIn: 'root' })
export class PurchaseOrderEditStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly warehouses = inject(WarehousesStore);
  private readonly record = inject(PurchaseOrderStore);

  readonly draft = signal<PoEditDraft | null>(null);
  readonly mappings = signal<readonly SupplierMapping[]>([]);
  readonly skus = signal<ReadonlyMap<string, MappedSku>>(new Map());
  readonly lineQuery = signal('');
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly conflict = signal<readonly PoConflictField[] | null>(null);

  private opened: PoEditDraft | null = null;
  private for: string | null = null;
  private baseVersion = 0;

  readonly destinations = computed(() =>
    this.warehouses.rows().filter((row) => row.status !== 'closed'),
  );

  readonly lineOptions = computed(() => {
    const query = this.lineQuery().trim().toLowerCase();
    const taken = new Set((this.draft()?.lines ?? []).map((line) => line.skuId));
    return this.mappings()
      .filter((mapping) => !taken.has(mapping.skuId) && mapping.status === 'active')
      .filter(
        (mapping) =>
          query.length === 0 ||
          mapping.skuCode.toLowerCase().includes(query) ||
          mapping.skuName.toLowerCase().includes(query),
      )
      .slice(0, 50);
  });

  /** What the command will carry: the fields that moved since the form opened (FM-09). */
  readonly changes = computed<Partial<PurchaseOrderInput>>(() => {
    const draft = this.draft();
    const opened = this.opened;
    if (draft === null || opened === null) return {};
    return {
      ...(draft.destinationWarehouseId !== opened.destinationWarehouseId
        ? { destinationWarehouseId: draft.destinationWarehouseId }
        : {}),
      ...(draft.expectedDate !== opened.expectedDate && draft.expectedDate
        ? { expectedDate: draft.expectedDate }
        : {}),
      ...(draft.notes !== opened.notes ? { notes: draft.notes } : {}),
      ...(draft.freight !== opened.freight ? { freightMinor: Math.round(draft.freight * 100) } : {}),
      ...(!sameLines(draft.lines, opened.lines) ? { lines: linesInput(draft.lines) } : {}),
    };
  });

  /**
   * §65.6: an approved order whose lines or freight move loses its approval
   * and returns to draft; the backend does it on save, the form says it first.
   */
  readonly withdrawsApproval = computed(() => {
    const changes = this.changes();
    return (
      this.record.po()?.status === 'approved' &&
      (changes.lines !== undefined || changes.freightMinor !== undefined)
    );
  });

  async start(): Promise<void> {
    const detail = this.record.detail();
    if (detail === null) return;
    if (this.for === detail.purchaseOrder.id && this.draft() !== null) return;
    this.for = detail.purchaseOrder.id;
    this.baseVersion = this.record.readVersion();
    this.opened = draftOf(detail, this.record.skus());
    this.draft.set(draftOf(detail, this.record.skus()));
    this.errors.set({});
    this.failure.set(null);
    this.conflict.set(null);
    const api = await this.backend.ready();
    const supplier = await this.health.read(() => api.suppliers.get(detail.purchaseOrder.supplierId), null);
    if (supplier === null) return;
    this.mappings.set(supplier.mappings);
    this.skus.set(await readMappedSkus(api, this.health, supplier.mappings.map((mapping) => mapping.skuId)));
  }

  cancel(): void {
    this.draft.set(null);
    this.opened = null;
    this.for = null;
    this.errors.set({});
    this.failure.set(null);
    this.conflict.set(null);
  }

  patch(patch: Partial<PoEditDraft>): void {
    this.draft.update((draft) => (draft === null ? draft : { ...draft, ...patch }));
  }

  patchLine(skuId: string, patch: Partial<PoDraftLine>): void {
    this.draft.update((draft) =>
      draft === null
        ? draft
        : {
            ...draft,
            lines: draft.lines.map((line) => (line.skuId === skuId ? { ...line, ...patch } : line)),
          },
    );
    this.errors.set(without(this.errors(), lineKey(skuId, 'quantity'), lineKey(skuId, 'unitCost'), 'lines'));
  }

  addSku(skuId: string): void {
    const draft = this.draft();
    const po = this.record.po();
    const mapping = this.mappings().find((candidate) => candidate.skuId === skuId);
    if (draft === null || po === null || mapping === undefined) return;
    this.patch({
      lines: [...draft.lines, lineFromMapping(mapping, po.currency, this.skus().get(skuId), null)],
    });
    this.lineQuery.set('');
  }

  remove(skuId: string): void {
    const draft = this.draft();
    if (draft !== null) this.patch({ lines: draft.lines.filter((line) => line.skuId !== skuId) });
  }

  check(): FormErrors {
    const draft = this.draft();
    if (draft === null) return {};
    const errors: Record<string, string[]> = { ...checkLines(draft.lines) };
    if (draft.freight < 0) errors['freightMinor'] = ['Freight is never below zero.'];
    return errors;
  }

  /** Writes the fields that moved and closes the form; a refusal keeps both open. */
  async save(): Promise<boolean> {
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0) return false;
    const changes = this.changes();
    if (Object.keys(changes).length === 0) {
      this.cancel();
      return true;
    }
    const version = this.baseVersion;
    const result = await this.record.write('save', (api, id) =>
      api.purchaseOrders.update(id, changes, { ifMatch: version }),
    );
    if (result.ok) {
      this.cancel();
      return true;
    }
    if (isApiError(result.error, 'STALE_VERSION')) {
      this.readConflict();
      return false;
    }
    this.failure.set(classify(result.error, PO_WORDS, 'The purchase order was not saved.'));
    this.errors.set(fieldErrors(result.error));
    return false;
  }

  /** The reader keeps what they wrote: the same fields go again over the version now stored. */
  async applyMine(): Promise<boolean> {
    // The comparison stays on what the form opened with, so only the reader's own fields travel (FM-09).
    this.baseVersion = this.record.readVersion();
    this.conflict.set(null);
    return this.save();
  }

  /** The reader takes the stored version: the form starts again from the record. */
  takeTheirs(): void {
    this.cancel();
    void this.start();
  }

  /** The record was read again by `write`; say what moved under the form, field by field. */
  private readConflict(): void {
    const detail = this.record.detail();
    const draft = this.draft();
    const opened = this.opened;
    if (detail === null || draft === null || opened === null) return;
    const now = draftOf(detail, this.record.skus());
    const currency = detail.purchaseOrder.currency;
    const say: Record<keyof PoEditDraft, [string, (draft: PoEditDraft) => string]> = {
      destinationWarehouseId: ['Deliver to', (d) => this.warehouses.code(d.destinationWarehouseId)],
      expectedDate: ['Expected', (d) => (d.expectedDate ? formatDate(d.expectedDate) : '—')],
      freight: ['Freight', (d) => formatMoney({ currency, minor: Math.round(d.freight * 100) })],
      notes: ['Notes', (d) => d.notes || '—'],
      lines: [
        'Lines',
        (d) => d.lines.map((line) => `${line.skuCode} × ${formatQuantity(String(line.quantity ?? 0))}`).join(', '),
      ],
    };
    const fields: PoConflictField[] = [];
    for (const key of Object.keys(say) as (keyof PoEditDraft)[]) {
      const [label, text] = say[key];
      if (text(opened) === text(now) && (key !== 'lines' || sameLines(opened.lines, now.lines))) continue;
      const mine = key === 'lines' ? !sameLines(opened.lines, draft.lines) : text(opened) !== text(draft);
      fields.push({ label, theirs: text(now), mine: mine ? text(draft) : null });
    }
    this.conflict.set(fields);
    this.failure.set({ code: 'STALE_VERSION', message: PO_WORDS['STALE_VERSION']!, kind: 'conflict' });
  }
}
