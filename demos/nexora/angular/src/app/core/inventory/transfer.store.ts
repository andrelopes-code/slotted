import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  InventoryListItem,
  InventoryTransferLine,
  NexoraApi,
  TransferListItem,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { classify, INVENTORY_CONFLICTS, without, type InventoryFailure } from './inventory-failure';
import { fitsPrecision, fromMilli, milli, quantityText } from './inventory.model';
import { readSkuFacts, type SkuFacts } from './sku-facts';
import { TransfersStore } from './transfers.store';

export type TransferLine = InventoryTransferLine & { skuCode: string; skuName: string };

/** A line with what the SKU is counted in and what the source can give today. */
export interface TransferLineRow extends TransferLine {
  readonly unit: string;
  readonly precision: number;
  /** Available at the source, read beside the transfer; null where the SKU has no position there. */
  readonly availableAtSource: string | null;
  /** Shipped and not yet received. */
  readonly outstanding: string;
}

export type TransferBusy = 'ready' | 'ship' | 'receive' | 'cancel';

export interface ReceiptEntry {
  readonly quantity: number | null;
  readonly damaged: number | null;
}

/** The module's words for what a transfer command can meet (§61, §78.2). */
const WORDS: Record<string, string> = {
  STALE_VERSION: 'Someone else moved this transfer on while the page was open.',
  INSUFFICIENT_AVAILABILITY:
    'The source warehouse no longer has the stock for every line, so the transfer stays a draft.',
  INVALID_STATE_TRANSITION: 'The transfer is no longer in a state that allows this.',
  FORBIDDEN: 'Your role does not move transfers between these warehouses.',
};

/**
 * One transfer (§61): its lines, its place in the cycle and the commands the
 * reader's permissions allow in that place. Every command but `create` carries
 * the version the page read, held as a number (ER-03); a refusal is classed
 * before it is shown, and a conflict reads the transfer again (ER-02).
 */
@Injectable({ providedIn: 'root' })
export class TransferStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly list = inject(TransfersStore);

  readonly id = signal<string | null>(null);
  readonly transfer = signal<TransferListItem | null>(null);
  readonly lines = signal<readonly TransferLine[]>([]);
  /** The SKUs' positions at the source, for their unit and what the source still has. */
  readonly sourceStock = signal<ReadonlyMap<string, InventoryListItem>>(new Map());
  readonly facts = signal<ReadonlyMap<string, SkuFacts>>(new Map());
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<TransferBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  /** What the reader typed into the receipt, by line; kept through a conflict (FM-08). */
  readonly receipt = signal<Readonly<Record<string, ReceiptEntry>>>({});
  readonly receiptErrors = signal<FormErrors>({});
  /** The outcome of the last receipt, said once in the page's words (§33, partial success). */
  readonly received = signal<{ complete: number; partial: number; damaged: number } | null>(null);

  private sequence = 0;
  private version = 0;

  readonly rows = computed<readonly TransferLineRow[]>(() => {
    const stock = this.sourceStock();
    const facts = this.facts();
    return this.lines().map((line) => {
      const position = stock.get(line.skuId);
      const fact = facts.get(line.skuId);
      return {
        ...line,
        unit: fact?.unit ?? position?.unitOfMeasure ?? '',
        precision: fact?.precision ?? 0,
        availableAtSource: position?.available ?? null,
        outstanding: fromMilli(milli(line.shippedQuantity) - milli(line.receivedQuantity)),
      };
    });
  });

  /** Lines whose request is more than the source can give today: `ready` would be refused. */
  readonly short = computed(() =>
    this.rows().filter(
      (row) =>
        row.availableAtSource === null || milli(row.availableAtSource) < milli(row.requestedQuantity),
    ),
  );

  private can(permission: string, warehouseId: string | undefined): boolean {
    void this.session.session();
    return (
      warehouseId !== undefined &&
      this.session.can(permission) &&
      this.warehouses.covers(warehouseId)
    );
  }

  /** `ready`, `ship` and `cancel` check the permission at the source; `receive` at the destination. */
  readonly canMoveAtSource = computed(() =>
    this.can('inventory.transfer', this.transfer()?.sourceWarehouseId),
  );
  readonly canReceive = computed(() =>
    this.can('inventory.transfer', this.transfer()?.destinationWarehouseId),
  );

  /**
   * True where the reader's scope covers neither end: `GET /transfers/:id`
   * answers any transfer to anyone holding `inventory.view`, so the page
   * refuses what the list would never have shown (the ledger row "a transfer
   * is read without its warehouse scope").
   */
  readonly outOfScope = computed(() => {
    const transfer = this.transfer();
    return (
      transfer !== null &&
      !this.warehouses.covers(transfer.sourceWarehouseId) &&
      !this.warehouses.covers(transfer.destinationWarehouseId)
    );
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.transfer.set(null);
      this.lines.set([]);
      this.sourceStock.set(new Map());
      this.facts.set(new Map());
      this.error.set(null);
      this.failure.set(null);
      this.receipt.set({});
      this.receiptErrors.set({});
      this.received.set(null);
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
      const detail = await api.inventory.transfers.get(id);
      if (ticket !== this.sequence) return;
      // The record, its units and the source's stock land together: a command drawn for the new
      // state never appears while the one that produced it is still waiting on its read-back.
      const [facts, stock] = await Promise.all([
        this.facts().size > 0
          ? Promise.resolve(this.facts())
          : readSkuFacts(api, this.health, detail.lines.map((line) => line.skuId)),
        this.readSourceStock(api, detail.transfer, detail.lines),
      ]);
      if (ticket !== this.sequence) return;
      this.version = detail.transfer.metadata.version;
      this.facts.set(facts);
      if (stock !== null) this.sourceStock.set(stock);
      this.transfer.set(detail.transfer);
      this.lines.set(detail.lines);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The transfer could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /**
   * A transfer line names its SKU by code and name only; the unit and what the
   * source holds come from the SKUs' positions there, in one read. A source
   * outside the reader's scope answers nothing, which is what it should.
   */
  private async readSourceStock(
    api: NexoraApi,
    transfer: TransferListItem,
    lines: readonly TransferLine[],
  ): Promise<ReadonlyMap<string, InventoryListItem> | null> {
    if (lines.length === 0) return null;
    const answer = await this.health.read(
      () =>
        api.inventory.list({
          pageSize: 100,
          filter: {
            warehouseId: { eq: transfer.sourceWarehouseId },
            skuId: { in: lines.map((line) => line.skuId) },
          },
        }),
      null,
    );
    return answer === null ? null : new Map(answer.data.map((row) => [row.skuId, row]));
  }

  markReady(): Promise<boolean> {
    return this.run('ready', (api, id, version) =>
      api.inventory.transfers.ready(id, { ifMatch: version }),
    );
  }

  ship(): Promise<boolean> {
    return this.run('ship', (api, id, version) =>
      api.inventory.transfers.ship(id, { ifMatch: version }),
    );
  }

  cancel(): Promise<boolean> {
    return this.run('cancel', (api, id, version) =>
      api.inventory.transfers.cancel(id, { ifMatch: version }),
    );
  }

  /** The receipt form opens on what is outstanding, and no damage. */
  startReceipt(): void {
    const entries: Record<string, ReceiptEntry> = {};
    for (const row of this.rows())
      entries[row.id] = { quantity: Number(row.outstanding), damaged: null };
    this.receipt.set(entries);
    this.receiptErrors.set({});
  }

  patchReceipt(lineId: string, patch: Partial<ReceiptEntry>): void {
    this.receipt.update((entries) => ({
      ...entries,
      [lineId]: { ...(entries[lineId] ?? { quantity: null, damaged: null }), ...patch },
    }));
    this.receiptErrors.set(
      without(this.receiptErrors(), `received.${lineId}.quantity`, `received.${lineId}.damaged`, 'received'),
    );
  }

  /** Each line's rules, said at the line: nothing more than is outstanding, damage within it (§61.2). */
  checkReceipt(): FormErrors {
    const errors: Record<string, string[]> = {};
    let any = false;
    for (const row of this.rows()) {
      const entry = this.receipt()[row.id];
      const text = quantityText(entry?.quantity ?? 0) ?? '0';
      const damaged = quantityText(entry?.damaged ?? 0) ?? '0';
      const key = `received.${row.id}`;
      if (milli(text) < 0 || milli(text) > milli(row.outstanding))
        errors[`${key}.quantity`] = [`Between 0 and ${row.outstanding} ${row.unit}.`];
      else if (!fitsPrecision(text, row.precision))
        errors[`${key}.quantity`] = [`${row.skuCode} is counted in whole ${row.unit}.`];
      if (milli(damaged) < 0 || milli(damaged) > milli(text))
        errors[`${key}.damaged`] = ['No more than the quantity received on this line.'];
      if (milli(text) > 0) any = true;
    }
    if (!any && Object.keys(errors).length === 0)
      errors['received'] = ['Receive at least one unit on one line.'];
    return errors;
  }

  async receive(): Promise<boolean> {
    this.received.set(null);
    const errors = this.checkReceipt();
    this.receiptErrors.set(errors);
    if (Object.keys(errors).length > 0) return false;
    const received: Record<string, { quantity: string; damaged?: string }> = {};
    for (const row of this.rows()) {
      if (milli(row.outstanding) === 0) continue;
      const entry = this.receipt()[row.id];
      const quantity = quantityText(entry?.quantity ?? 0) ?? '0';
      const damaged = quantityText(entry?.damaged ?? 0) ?? '0';
      received[row.id] = { quantity, ...(milli(damaged) > 0 ? { damaged } : {}) };
    }
    const before = new Map(this.rows().map((row) => [row.id, row.outstanding]));
    const ok = await this.run('receive', (api, id, version) =>
      api.inventory.transfers.receive(id, { received }, { ifMatch: version }),
    );
    if (ok) {
      let complete = 0;
      let partial = 0;
      let damaged = 0;
      for (const row of this.rows()) {
        const entry = received[row.id];
        if (!entry || milli(entry.quantity) === 0) continue;
        if (entry.damaged) damaged += 1;
        if (milli(entry.quantity) === milli(before.get(row.id) ?? '0')) complete += 1;
        else partial += 1;
      }
      this.received.set({ complete, partial, damaged });
      this.receipt.set({});
    }
    return ok;
  }

  private async run(
    kind: TransferBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const transfer = this.transfer();
    if (transfer === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, transfer.id, this.version));
      await this.load();
      if (this.list.total() !== null) void this.list.reload();
      return true;
    } catch (error) {
      const failure = classify(error, WORDS, 'The transfer was not changed.');
      this.failure.set(failure);
      // A conflict or a stock that moved means the page is out of date: read it again.
      if (
        INVENTORY_CONFLICTS.has(failure.code) ||
        failure.code === 'INSUFFICIENT_AVAILABILITY' ||
        failure.code === 'INVALID_STATE_TRANSITION'
      )
        await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }
}

