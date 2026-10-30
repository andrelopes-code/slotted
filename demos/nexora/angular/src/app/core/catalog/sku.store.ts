import { computed, inject, Injectable, signal } from '@angular/core';
import type { InventoryPosition, SkuDetail } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';
import { WarehousesStore } from './warehouses.store';

/** One warehouse's position, with the place named and the reader's own marked. */
export interface StockRow extends InventoryPosition {
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly isOwn: boolean;
}

/**
 * One SKU: what exists and where, what is held against orders, what is on its
 * way, what it sells for, who it is bought from and what moved it lately.
 *
 * Two facts of the answer are decided by the reader's permissions rather than
 * by the record. `getSku` writes `standardCost` down to zero without
 * `cost.view` and returns `priceEntries` empty without `pricing.view`, so the
 * store states what is readable and the screen draws nothing for the rest
 * (PM-01): a cost of US$0.00 drawn as a cost is a lie the backend hands over.
 */
@Injectable({ providedIn: 'root' })
export class SkuStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<SkuDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);

  readonly sku = computed(() => this.detail()?.sku ?? null);
  readonly product = computed(() => this.detail()?.product ?? null);
  readonly categoryPath = computed(() => this.detail()?.categoryPath ?? []);
  readonly movements = computed(() => this.detail()?.recentMovements ?? []);
  readonly suppliers = computed(() => this.detail()?.supplierMappings ?? []);

  /** What the reader may be shown at all; the absent value is never drawn. */
  readonly canSeePricing = computed(() => this.session.can('pricing.view'));
  readonly canSeeCost = computed(() => this.session.can('cost.view'));

  readonly priceEntries = computed(() => (this.canSeePricing() ? (this.detail()?.priceEntries ?? []) : []));

  readonly stock = computed<readonly StockRow[]>(() =>
    (this.detail()?.inventory ?? []).map((position) => ({
      ...position,
      warehouseCode: this.warehouses.code(position.warehouseId),
      warehouseName: this.warehouses.name(position.warehouseId),
      isOwn: this.warehouses.isOwn(position.warehouseId),
    })),
  );

  readonly reorderSuggestions = computed(() => this.detail()?.reorderSuggestions ?? []);
  readonly placesWithStock = computed(() => this.stock().filter((row) => Number(row.onHand) !== 0).length);
  readonly placesWithInbound = computed(() => this.stock().filter((row) => Number(row.inbound) > 0));

  /** The decomposition has to add up to the figure above it (RP-07). */
  readonly stockSum = computed(() =>
    this.stock().reduce(
      (sum, row) => ({
        onHand: sum.onHand + Number(row.onHand),
        available: sum.available + Number(row.available),
        reserved: sum.reserved + Number(row.reserved),
        inbound: sum.inbound + Number(row.inbound),
      }),
      { onHand: 0, available: 0, reserved: 0, inbound: 0 },
    ),
  );

  private sequence = 0;

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.error.set(null);
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
      const detail = await api.catalog.sku(id);
      if (ticket !== this.sequence) return;
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The SKU could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }
}
