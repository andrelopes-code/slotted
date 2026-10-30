import { computed, inject, Injectable, signal } from '@angular/core';
import type { ProductDetail, SkuListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';

/**
 * One product and the SKUs filed under it. The catalogue is read-only, so the
 * store holds no version and runs no command: a product has a state the
 * backend computes and no command that changes it.
 */
@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);

  readonly id = signal<string | null>(null);
  readonly detail = signal<ProductDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);

  readonly product = computed(() => this.detail()?.product ?? null);
  readonly skus = computed<readonly SkuListItem[]>(() => this.detail()?.skus ?? []);
  readonly categoryPath = computed(() => this.detail()?.categoryPath ?? []);

  /** Counts, not sums: two SKUs of one product need not be counted in one unit (RP-08). */
  readonly activeCount = computed(() => this.skus().filter((sku) => sku.status === 'active').length);
  readonly belowReorderCount = computed(() => this.skus().filter((sku) => sku.belowReorderPoint).length);
  readonly outOfStockCount = computed(() => this.skus().filter((sku) => Number(sku.available) <= 0).length);
  readonly inboundCount = computed(() => this.skus().filter((sku) => Number(sku.inbound) > 0).length);
  /** True where every SKU of the product is counted in one unit, so a sum would read. */
  readonly units = computed(() => [...new Set(this.skus().map((sku) => sku.unitOfMeasure))]);

  private sequence = 0;

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
      const detail = await api.catalog.product(id);
      if (ticket !== this.sequence) return;
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The product could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }
}
