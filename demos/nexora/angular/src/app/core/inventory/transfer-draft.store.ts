import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { InventoryListItem, TransferListItem } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { classify, fieldErrors, without, type InventoryFailure } from './inventory-failure';
import { fitsPrecision, milli, quantityText } from './inventory.model';
import { readSkuFacts } from './sku-facts';
import { TransfersStore } from './transfers.store';

export interface TransferDraftLine {
  readonly skuId: string;
  readonly skuCode: string;
  readonly skuName: string;
  readonly unit: string;
  readonly precision: number;
  /** Available at the source when the line was added. */
  readonly available: string;
  readonly quantity: number | null;
}

const WORDS: Record<string, string> = {
  TRANSFER_SAME_WAREHOUSE: 'The stock has to go to another warehouse than the one it leaves.',
  FORBIDDEN: 'Your role does not send transfers from this warehouse.',
};

/**
 * A transfer being written (§61): where it leaves, where it goes, what it
 * carries. The draft lives here rather than in the page, so leaving the form
 * and coming back finds it (FM-05); the create empties it.
 */
@Injectable({ providedIn: 'root' })
export class TransferDraftStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly list = inject(TransfersStore);

  readonly sourceWarehouseId = signal<string | null>(null);
  readonly destinationWarehouseId = signal<string | null>(null);
  readonly lines = signal<readonly TransferDraftLine[]>([]);
  readonly notes = signal('');

  readonly skuQuery = signal('');
  readonly skuOptions = signal<readonly InventoryListItem[]>([]);
  readonly searching = signal(false);

  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal(false);

  /** Where a transfer may leave: the warehouses in which the reader holds `inventory.transfer`. */
  readonly sources = computed(() => {
    void this.session.session();
    return this.session.can('inventory.transfer') ? this.warehouses.inScope() : [];
  });

  /** Where it may go: any other warehouse that can receive (§89.15: a closed one cannot). */
  readonly destinations = computed(() =>
    this.warehouses
      .rows()
      .filter((row) => row.id !== this.sourceWarehouseId() && row.status !== 'closed'),
  );

  /** Lines asking for more than the source holds today: `ready` will refuse them until it does. */
  readonly short = computed(() =>
    this.lines().filter((line) => {
      const text = quantityText(line.quantity);
      return text !== null && milli(text) > milli(line.available);
    }),
  );

  private ticket = 0;

  /** A transfer opened from a shortage arrives with its SKU and its destination named. */
  async prefill(from: string | null, to: string | null, skuId: string | null): Promise<void> {
    await this.warehouses.open();
    if (from !== null && this.sources().some((row) => row.id === from)) this.setSource(from);
    if (to !== null && to !== this.sourceWarehouseId()) this.destinationWarehouseId.set(to);
    if (skuId !== null && this.sourceWarehouseId() !== null && !this.lines().some((l) => l.skuId === skuId)) {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () =>
          api.inventory.list({
            pageSize: 25,
            filter: { skuId: { eq: skuId }, warehouseId: { eq: this.sourceWarehouseId()! } },
          }),
        null,
      );
      const position = answer?.data[0];
      if (position) await this.add(position);
    }
  }

  /** A new source empties the lines: what was available was available somewhere else. */
  setSource(id: string | null): void {
    if (id === this.sourceWarehouseId()) return;
    this.sourceWarehouseId.set(id);
    if (this.destinationWarehouseId() === id) this.destinationWarehouseId.set(null);
    this.lines.set([]);
    this.skuOptions.set([]);
    this.skuQuery.set('');
  }

  async search(query: string): Promise<void> {
    this.skuQuery.set(query);
    const ticket = ++this.ticket;
    const source = this.sourceWarehouseId();
    if (query.trim().length < 2 || source === null) {
      this.skuOptions.set([]);
      return;
    }
    this.searching.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () =>
          api.inventory.list({
            q: query.trim(),
            pageSize: 25,
            sort: 'skuCode',
            filter: { warehouseId: { eq: source } },
          }),
        null,
      );
      if (ticket !== this.ticket || answer === null) return;
      this.skuOptions.set(answer.data);
    } finally {
      if (ticket === this.ticket) this.searching.set(false);
    }
  }

  async add(position: InventoryListItem): Promise<void> {
    if (this.lines().some((line) => line.skuId === position.skuId)) return;
    const api = await this.backend.ready();
    const facts = await readSkuFacts(api, this.health, [position.skuId]);
    const fact = facts.get(position.skuId);
    this.lines.update((lines) => [
      ...lines,
      {
        skuId: position.skuId,
        skuCode: position.skuCode,
        skuName: position.skuName,
        unit: fact?.unit ?? position.unitOfMeasure,
        precision: fact?.precision ?? 0,
        available: position.available,
        quantity: null,
      },
    ]);
    this.skuQuery.set('');
    this.skuOptions.set([]);
  }

  setQuantity(skuId: string, quantity: number | null): void {
    this.lines.update((lines) =>
      lines.map((line) => (line.skuId === skuId ? { ...line, quantity } : line)),
    );
    this.errors.set(without(this.errors(), `lines.${skuId}.quantity`, 'lines'));
  }

  remove(skuId: string): void {
    this.lines.update((lines) => lines.filter((line) => line.skuId !== skuId));
  }

  reset(): void {
    this.sourceWarehouseId.set(null);
    this.destinationWarehouseId.set(null);
    this.lines.set([]);
    this.notes.set('');
    this.skuQuery.set('');
    this.skuOptions.set([]);
    this.errors.set({});
    this.failure.set(null);
  }

  /** §61.2's rules, said at the control before the command is sent. */
  check(): FormErrors {
    const errors: Record<string, string[]> = {};
    if (this.sourceWarehouseId() === null)
      errors['sourceWarehouseId'] = ['Choose the warehouse the stock leaves.'];
    if (this.destinationWarehouseId() === null)
      errors['destinationWarehouseId'] = ['Choose the warehouse the stock goes to.'];
    else if (this.destinationWarehouseId() === this.sourceWarehouseId())
      errors['destinationWarehouseId'] = [WORDS['TRANSFER_SAME_WAREHOUSE']!];
    if (this.lines().length === 0) errors['lines'] = ['A transfer carries at least one line.'];
    for (const line of this.lines()) {
      const text = quantityText(line.quantity);
      const key = `lines.${line.skuId}.quantity`;
      if (text === null || milli(text) <= 0) errors[key] = ['More than zero.'];
      else if (!fitsPrecision(text, line.precision))
        errors[key] = [
          line.precision === 0
            ? `${line.skuCode} is counted in whole ${line.unit}.`
            : `${line.skuCode} is counted to ${line.precision} decimal places.`,
        ];
    }
    return errors;
  }

  async create(): Promise<TransferListItem | null> {
    const source = this.sourceWarehouseId();
    const destination = this.destinationWarehouseId();
    if (this.creating()) return null;
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0 || source === null || destination === null) return null;
    this.creating.set(true);
    try {
      const api = await this.backend.ready();
      const detail = await this.health.mutation(() =>
        api.inventory.transfers.create({
          sourceWarehouseId: source,
          destinationWarehouseId: destination,
          lines: this.lines().map((line) => ({
            skuId: line.skuId,
            quantity: quantityText(line.quantity)!,
          })),
          ...(this.notes().trim() ? { notes: this.notes().trim() } : {}),
        }),
      );
      this.reset();
      if (this.list.total() !== null) void this.list.reload();
      return detail.transfer;
    } catch (error) {
      const failure = classify(error, WORDS, 'The transfer was not written.');
      const byField = fieldErrors(error);
      if (failure.code === 'TRANSFER_SAME_WAREHOUSE')
        byField['destinationWarehouseId'] = [failure.message];
      this.errors.set(byField);
      this.failure.set(failure);
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}

