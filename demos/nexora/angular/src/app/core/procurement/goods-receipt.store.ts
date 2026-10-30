import { computed, inject, Injectable, signal } from '@angular/core';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';
import type { GoodsReceiptDetail } from './procurement.model';
import { readMappedSkus, type MappedSku } from './purchase-order-draft.store';

/**
 * One goods receipt (§65.7), read by `GET /goods-receipts/:id` — the only way
 * to a receipt, since no endpoint lists them. A receipt taken at a warehouse
 * outside the reader's scope is refused by the read itself (`FORBIDDEN`).
 */
@Injectable({ providedIn: 'root' })
export class GoodsReceiptStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<GoodsReceiptDetail | null>(null);
  readonly skus = signal<ReadonlyMap<string, MappedSku>>(new Map());
  /** The bins of the receiving warehouse by id, so a line names its bin by code (LG-01). */
  readonly bins = signal<ReadonlyMap<string, string>>(new Map());
  /** A read is on its way; the receipt already shown stays until the answer replaces it (AF-02). */
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  private sequence = 0;

  readonly receipt = computed(() => this.detail()?.receipt ?? null);
  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.error.set(null);
    }
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
      const detail = await api.purchaseOrders.receipt(id);
      const [skus, locations] = await Promise.all([
        readMappedSkus(
          api,
          this.health,
          detail.lines.map((line) => line.skuId),
        ),
        detail.lines.some((line) => line.locationId)
          ? // A warehouse outside the reader's scope refuses its bins; the page then refuses the receipt.
            this.health
              .read(() => api.inventory.locations(detail.receipt.warehouseId), [])
              .catch(() => [])
          : Promise.resolve([]),
      ]);
      if (ticket !== this.sequence) return;
      this.skus.set(skus);
      this.bins.set(new Map(locations.map((location) => [location.id, location.code])));
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The receipt could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }
}
