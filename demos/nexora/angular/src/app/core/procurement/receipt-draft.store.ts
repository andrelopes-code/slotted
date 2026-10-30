import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { WarehouseLocation } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { classify, fieldErrors, without, type InventoryFailure } from '../inventory/inventory-failure';
import { fitsPrecision, fromMilli, milli, quantityText } from '../inventory/inventory.model';
import { SessionStore } from '../session/session.store';
import { OVER_RECEIPT_TOLERANCE, RECEIVED_SHARE } from './procurement.model';
import { PO_WORDS } from './purchase-order-draft.store';
import { PurchaseOrderStore, type PurchaseOrderLineRow } from './purchase-order.store';

/** What arrived on one line: three destinations, a bin and a note (§65.7). */
export interface ReceiptLineEntry {
  readonly accepted: number | null;
  readonly damaged: number | null;
  readonly rejected: number | null;
  readonly locationId: string | null;
  readonly note: string;
}

const EMPTY: ReceiptLineEntry = { accepted: null, damaged: null, rejected: null, locationId: null, note: '' };

export const receiptKey = (lineId: string, field: 'accepted' | 'damaged' | 'rejected'): string =>
  `lines.${lineId}.${field}`;

const amount = (value: number | null): number => milli(quantityText(value ?? 0) ?? '0');

/**
 * The goods receipt being written against the order on screen. What the
 * reader typed survives a refusal and a conflict (FM-08); the rules the
 * backend applies — a receipt of something, the 5% tolerance and who may go
 * past it, the order closing once every line reaches 95% — are applied as the
 * reader types, so the form says them before the confirm (FM-11).
 */
@Injectable({ providedIn: 'root' })
export class ReceiptDraftStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly record = inject(PurchaseOrderStore);

  readonly entries = signal<Readonly<Record<string, ReceiptLineEntry>>>({});
  readonly notes = signal('');
  readonly overReceiptReason = signal('');
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly locations = signal<readonly WarehouseLocation[]>([]);
  /** The receipt the last confirm wrote, with what it left open (§33, partial success). */
  readonly written = signal<{
    id: string;
    number: string;
    complete: boolean;
    openLines: number;
  } | null>(null);

  private for: string | null = null;

  readonly canExceed = computed(() => {
    void this.session.session();
    return this.session.can('purchase_orders.approve');
  });

  /** The lines still owed something; a line received in full takes no more without an approver. */
  readonly rows = computed(() => this.record.rows());

  entry(lineId: string): ReceiptLineEntry {
    return this.entries()[lineId] ?? EMPTY;
  }

  /** Everything this receipt brings to the line, in milli-units. */
  private incoming(lineId: string): number {
    const entry = this.entry(lineId);
    return amount(entry.accepted) + amount(entry.damaged) + amount(entry.rejected);
  }

  /** The line's total after this receipt, against what was ordered. */
  after(row: PurchaseOrderLineRow): number {
    return milli(row.receivedTotal) + this.incoming(row.id);
  }

  /** Lines this receipt takes past 5% over their order: each needs an approver and a reason. */
  readonly overTolerance = computed(() =>
    // The same comparison `receive` makes, so the form and the backend draw the line at one place.
    this.rows().filter((row) => this.after(row) > milli(row.orderedQuantity) * OVER_RECEIPT_TOLERANCE),
  );

  /** Lines this receipt takes over their order, within the tolerance. */
  readonly overOrder = computed(() =>
    this.rows().filter(
      (row) =>
        this.after(row) > milli(row.orderedQuantity) &&
        !this.overTolerance().some((over) => over.id === row.id),
    ),
  );

  /** What the confirm does, by destination, counted in lines (RP-08: the SKUs share no unit). */
  readonly outcome = computed(() => {
    let intoStock = 0;
    let damaged = 0;
    let rejected = 0;
    for (const row of this.rows()) {
      const entry = this.entry(row.id);
      if (amount(entry.accepted) + amount(entry.damaged) > 0) intoStock += 1;
      if (amount(entry.damaged) > 0) damaged += 1;
      if (amount(entry.rejected) > 0) rejected += 1;
    }
    // `receive` closes the order once every line has 95% of its order through the door.
    const open = this.rows().filter(
      (row) => this.after(row) < milli(row.orderedQuantity) * RECEIVED_SHARE,
    ).length;
    return { intoStock, damaged, rejected, open, complete: open === 0 };
  });

  /** The form opens on what each line still owes, all of it accepted, once per order. */
  async start(): Promise<void> {
    const po = this.record.po();
    if (po === null) return;
    if (this.for !== po.id || Object.keys(this.entries()).length === 0) {
      this.for = po.id;
      const entries: Record<string, ReceiptLineEntry> = {};
      for (const row of this.rows())
        entries[row.id] = { ...EMPTY, accepted: milli(row.openQuantity) > 0 ? Number(row.openQuantity) : null };
      this.entries.set(entries);
      this.notes.set('');
      this.overReceiptReason.set('');
      this.errors.set({});
      this.failure.set(null);
    }
    if (this.locations().length === 0 || this.locations()[0]?.warehouseId !== po.destinationWarehouseId) {
      const api = await this.backend.ready();
      const all = await this.health.read(() => api.inventory.locations(po.destinationWarehouseId), []);
      this.locations.set(
        all.filter(
          (location) =>
            location.status === 'active' && (location.type === 'receiving' || location.type === 'storage'),
        ),
      );
    }
  }

  patch(lineId: string, patch: Partial<ReceiptLineEntry>): void {
    this.entries.update((entries) => ({ ...entries, [lineId]: { ...(entries[lineId] ?? EMPTY), ...patch } }));
    this.errors.set(
      without(
        this.errors(),
        receiptKey(lineId, 'accepted'),
        receiptKey(lineId, 'damaged'),
        receiptKey(lineId, 'rejected'),
        'lines',
        'overReceiptReason',
      ),
    );
  }

  setReason(reason: string): void {
    this.overReceiptReason.set(reason);
    this.errors.set(without(this.errors(), 'overReceiptReason'));
  }

  forget(): void {
    this.entries.set({});
    this.for = null;
    this.errors.set({});
    this.failure.set(null);
  }

  check(): FormErrors {
    const errors: Record<string, string[]> = {};
    let any = false;
    for (const row of this.rows()) {
      const entry = this.entry(row.id);
      for (const field of ['accepted', 'damaged', 'rejected'] as const) {
        const value = entry[field];
        if (value === null) continue;
        const text = quantityText(value) ?? '0';
        if (milli(text) < 0) errors[receiptKey(row.id, field)] = ['Never below zero.'];
        else if (!fitsPrecision(text, row.precision))
          errors[receiptKey(row.id, field)] = [
            row.precision === 0
              ? `${row.skuCode} is counted in whole ${row.unit}.`
              : `${row.skuCode} is counted to ${row.precision} decimal places.`,
          ];
      }
      if (this.incoming(row.id) > 0) any = true;
    }
    const over = this.overTolerance();
    for (const row of over) {
      const ceiling = fromMilli(Math.floor(milli(row.orderedQuantity) * OVER_RECEIPT_TOLERANCE));
      if (!this.canExceed())
        errors[receiptKey(row.id, 'accepted')] = [
          `More than ${ceiling} ${row.unit} in all, 5% over the ${row.orderedQuantity} ordered: only a holder of purchase_orders.approve can receive it.`,
        ];
    }
    if (over.length > 0 && this.canExceed() && this.overReceiptReason().trim() === '')
      errors['overReceiptReason'] = ['Say why more than 5% over the order is being received.'];
    if (!any && Object.keys(errors).length === 0) errors['lines'] = [PO_WORDS['RECEIPT_EMPTY']!];
    return errors;
  }

  async receive(): Promise<boolean> {
    this.written.set(null);
    this.failure.set(null);
    const errors = this.check();
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) return false;
    const lines: Record<
      string,
      { accepted: string; damaged?: string; rejected?: string; locationId?: string; note?: string }
    > = {};
    for (const row of this.rows()) {
      if (this.incoming(row.id) === 0) continue;
      const entry = this.entry(row.id);
      const damaged = quantityText(entry.damaged ?? 0) ?? '0';
      const rejected = quantityText(entry.rejected ?? 0) ?? '0';
      lines[row.id] = {
        accepted: quantityText(entry.accepted ?? 0) ?? '0',
        ...(milli(damaged) > 0 ? { damaged } : {}),
        ...(milli(rejected) > 0 ? { rejected } : {}),
        ...(entry.locationId ? { locationId: entry.locationId } : {}),
        ...(entry.note.trim() ? { note: entry.note.trim() } : {}),
      };
    }
    const outcome = this.outcome();
    const result = await this.record.write('receive', (api, id, version) =>
      api.purchaseOrders.receive(
        id,
        {
          lines,
          ...(this.notes().trim() ? { notes: this.notes().trim() } : {}),
          ...(this.overTolerance().length > 0 && this.overReceiptReason().trim()
            ? { overReceiptReason: this.overReceiptReason().trim() }
            : {}),
        },
        { ifMatch: version },
      ),
    );
    if (result.ok) {
      const po = this.record.po();
      this.written.set({
        id: result.value.receipt.id,
        number: result.value.receipt.receiptNumber,
        complete: po?.status === 'received',
        openLines: outcome.open,
      });
      this.forget();
      return true;
    }
    const failure = classify(result.error, PO_WORDS, 'Nothing was received.');
    this.failure.set(failure);
    const byField = fieldErrors(result.error);
    if (isApiError(result.error, 'OVER_RECEIPT_TOLERANCE')) byField['overReceiptReason'] = [failure.message];
    if (isApiError(result.error, 'RECEIPT_EMPTY')) byField['lines'] = [failure.message];
    this.errors.set(byField);
    return false;
  }
}
