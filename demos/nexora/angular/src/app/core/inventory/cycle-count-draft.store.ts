import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { CycleCountListItem, InventoryListItem } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { CycleCountsStore } from './cycle-counts.store';
import { classify, fieldErrors, type InventoryFailure } from './inventory-failure';

export interface CountDraftSku {
  readonly skuId: string;
  readonly skuCode: string;
  readonly skuName: string;
  readonly unit: string;
  readonly onHand: string;
}

const WORDS: Record<string, string> = {
  FORBIDDEN: 'Your role does not count stock in this warehouse.',
};

/**
 * A cycle count being planned (§62): which warehouse, which day and which
 * SKUs. The draft outlives the page (FM-05). Nexora places each SKU in one of
 * the warehouse's storage locations itself, so the form does not ask for one.
 */
@Injectable({ providedIn: 'root' })
export class CycleCountDraftStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly list = inject(CycleCountsStore);

  readonly warehouseId = signal<string | null>(null);
  readonly plannedDate = signal('');
  readonly skus = signal<readonly CountDraftSku[]>([]);

  readonly skuQuery = signal('');
  readonly skuOptions = signal<readonly InventoryListItem[]>([]);
  readonly searching = signal(false);

  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal(false);

  /** The warehouses in which the reader counts: `inventory.cycle_count` within their scope. */
  readonly places = computed(() => {
    void this.session.session();
    return this.session.can('inventory.cycle_count') ? this.warehouses.inScope() : [];
  });

  private ticket = 0;

  async prepare(today: string): Promise<void> {
    await this.warehouses.open();
    if (this.plannedDate() === '') this.plannedDate.set(today);
    const places = this.places();
    if (this.warehouseId() === null && places.length === 1) this.warehouseId.set(places[0]!.id);
  }

  /** A new warehouse empties the SKUs: they were chosen from the other one's stock. */
  setWarehouse(id: string | null): void {
    if (id === this.warehouseId()) return;
    this.warehouseId.set(id);
    this.skus.set([]);
    this.skuOptions.set([]);
    this.skuQuery.set('');
  }

  async search(query: string): Promise<void> {
    this.skuQuery.set(query);
    const ticket = ++this.ticket;
    const warehouse = this.warehouseId();
    if (query.trim().length < 2 || warehouse === null) {
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
            filter: { warehouseId: { eq: warehouse } },
          }),
        null,
      );
      if (ticket !== this.ticket || answer === null) return;
      this.skuOptions.set(answer.data);
    } finally {
      if (ticket === this.ticket) this.searching.set(false);
    }
  }

  add(position: InventoryListItem): void {
    if (this.skus().some((sku) => sku.skuId === position.skuId)) return;
    this.skus.update((skus) => [
      ...skus,
      {
        skuId: position.skuId,
        skuCode: position.skuCode,
        skuName: position.skuName,
        unit: position.unitOfMeasure,
        onHand: position.onHand,
      },
    ]);
    this.skuQuery.set('');
    this.skuOptions.set([]);
  }

  remove(skuId: string): void {
    this.skus.update((skus) => skus.filter((sku) => sku.skuId !== skuId));
  }

  reset(): void {
    this.warehouseId.set(null);
    this.plannedDate.set('');
    this.skus.set([]);
    this.skuQuery.set('');
    this.skuOptions.set([]);
    this.errors.set({});
    this.failure.set(null);
  }

  check(): FormErrors {
    const errors: Record<string, string[]> = {};
    if (this.warehouseId() === null) errors['warehouseId'] = ['Choose the warehouse to count.'];
    if (this.plannedDate() === '') errors['plannedDate'] = ['Choose the day of the count.'];
    if (this.skus().length === 0) errors['skuIds'] = ['A count covers at least one SKU.'];
    return errors;
  }

  async create(): Promise<CycleCountListItem | null> {
    if (this.creating()) return null;
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    const warehouse = this.warehouseId();
    if (Object.keys(errors).length > 0 || warehouse === null) return null;
    this.creating.set(true);
    try {
      const api = await this.backend.ready();
      const detail = await this.health.mutation(() =>
        api.inventory.cycleCounts.create({
          warehouseId: warehouse,
          plannedDate: this.plannedDate(),
          skuIds: this.skus().map((sku) => sku.skuId),
        }),
      );
      this.reset();
      if (this.list.total() !== null) void this.list.reload();
      return detail.cycleCount;
    } catch (error) {
      this.errors.set(fieldErrors(error));
      this.failure.set(classify(error, WORDS, 'The count was not planned.'));
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}
