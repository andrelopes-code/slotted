import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  CycleCountListItem,
  InventoryListItem,
  MovementListItem,
  TransferListItem,
  WarehouseLocation,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import type { WarehouseListItem } from './inventory.model';

/** A slice of a listing read for a record's tab: the first rows and how many there are. */
export interface Slice<T> {
  readonly rows: readonly T[];
  readonly total: number;
}

export interface WarehouseRecord {
  readonly locations: readonly WarehouseLocation[];
  readonly positions: number;
  readonly belowReorder: Slice<InventoryListItem>;
  readonly nothingAvailable: number;
  readonly movements: Slice<MovementListItem>;
  readonly counts: Slice<CycleCountListItem>;
  readonly transfers: Slice<TransferListItem>;
}

/**
 * One warehouse: the place (`GET /warehouses`), its locations (§60.8), and the
 * first rows of what happens in it — the positions below their reorder point,
 * the last movements, the counts and the transfers that leave or reach it.
 * Each tab says how many there are and leads to the list that holds them all.
 *
 * The directory answers every warehouse to anyone holding `inventory.view`;
 * the page refuses one outside the reader's scope rather than show its place
 * beside a list that would be empty for them.
 */
@Injectable({ providedIn: 'root' })
export class WarehouseStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  readonly directory = inject(WarehousesStore);

  readonly id = signal<string | null>(null);
  readonly record = signal<WarehouseRecord | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);

  readonly warehouse = computed<WarehouseListItem | null>(
    () => this.directory.byId().get(this.id() ?? '') ?? null,
  );
  readonly outOfScope = computed(() => {
    const id = this.id();
    return id !== null && this.directory.loaded() && !this.directory.covers(id);
  });

  private sequence = 0;

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.record.set(null);
      this.error.set(null);
    }
    await this.directory.open();
    if (this.directory.byId().get(id) === undefined) {
      this.error.set({ code: 'NOT_FOUND', message: `No warehouse is filed under ${id}.` });
      return;
    }
    if (!this.directory.covers(id)) return;
    await this.load();
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const at = { warehouseId: { eq: id } };
      const [locations, positions, belowReorder, nothingAvailable, movements, counts, out, into] =
        await Promise.all([
          api.inventory.locations(id),
          api.inventory.list({ pageSize: 25, sort: 'onHand', filter: at }),
          api.inventory.list({
            pageSize: 25,
            sort: 'available',
            filter: { ...at, belowReorderPoint: true },
          }),
          api.inventory.list({ pageSize: 25, sort: 'onHand', filter: { ...at, available: { lte: 0 } } }),
          api.inventory.movements({ pageSize: 25, filter: at }),
          api.inventory.cycleCounts.list({ pageSize: 25, filter: at }),
          api.inventory.transfers.list({ pageSize: 25, filter: { sourceWarehouseId: { eq: id } } }),
          api.inventory.transfers.list({
            pageSize: 25,
            filter: { destinationWarehouseId: { eq: id } },
          }),
        ]);
      if (ticket !== this.sequence) return;
      const transfers = [...out.data, ...into.data].sort((a, b) =>
        b.requestedDate.localeCompare(a.requestedDate),
      );
      this.record.set({
        locations,
        positions: positions.page.totalItems,
        belowReorder: { rows: belowReorder.data, total: belowReorder.page.totalItems },
        nothingAvailable: nothingAvailable.page.totalItems,
        movements: { rows: movements.data, total: movements.page.totalItems },
        counts: { rows: counts.data, total: counts.page.totalItems },
        transfers: {
          rows: transfers.slice(0, 25),
          total: out.page.totalItems + into.page.totalItems,
        },
      });
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The warehouse could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }
}
