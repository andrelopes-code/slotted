import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { PriceList, SkuDetail, SkuListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';

export interface PriceListRow extends PriceList {
  entryCount: number;
}

/** One list beside the price the chosen SKU carries in it, or the absence of one. */
export interface SkuPriceRow {
  readonly listId: string;
  readonly listName: string;
  readonly regionCode: PriceList['regionCode'];
  readonly status: PriceList['status'];
  readonly currency: PriceList['currency'];
  readonly unitPrice: SkuDetail['priceEntries'][number]['unitPrice'] | null;
  readonly validFrom: string | null;
  readonly validTo: string | null;
}

/**
 * The price lists, and one SKU read across them.
 *
 * `GET /price-lists` answers with the lists and how many entries each holds;
 * no resource exposes `priceEntriesByList`, so the entries of a list cannot be
 * listed at all. What can be read is the other axis: `SkuDetail.priceEntries`
 * gives one SKU's price in every list it is in. The screen is built on that
 * axis and says so. See the ledger row "no endpoint lists the entries of a
 * price list".
 */
@Injectable({ providedIn: 'root' })
export class PriceListsStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly sessionStore = inject(SessionStore);

  readonly lists = signal<readonly PriceListRow[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  /** The SKU search behind the lookup: the query, the hits and the wait. */
  readonly query = signal('');
  readonly matches = signal<readonly SkuListItem[]>([]);
  readonly searching = signal(false);
  readonly chosenId = signal<string | null>(null);
  readonly chosen = signal<SkuDetail | null>(null);
  readonly pricing = signal(false);
  readonly lookupError = signal<string | null>(null);

  readonly entryTotal = computed(() =>
    this.lists().reduce((sum, list) => sum + list.entryCount, 0),
  );
  readonly currencies = computed(() => [...new Set(this.lists().map((list) => list.currency))]);
  readonly regions = computed(() => [...new Set(this.lists().map((list) => list.regionCode))]);
  readonly activeCount = computed(() => this.lists().filter((list) => list.status === 'active').length);

  /** Every list beside what the chosen SKU costs in it; a list with no entry says so. */
  readonly skuPrices = computed<readonly SkuPriceRow[]>(() => {
    const detail = this.chosen();
    if (detail === null) return [];
    const byList = new Map(detail.priceEntries.map((entry) => [entry.priceListId, entry]));
    return this.lists().map((list) => {
      const entry = byList.get(list.id);
      return {
        listId: list.id,
        listName: list.name,
        regionCode: list.regionCode,
        status: list.status,
        currency: list.currency,
        unitPrice: entry?.unitPrice ?? null,
        validFrom: entry?.validFrom ?? null,
        validTo: entry?.validTo ?? null,
      };
    });
  });

  readonly pricedCount = computed(() => this.skuPrices().filter((row) => row.unitPrice !== null).length);

  private tenant: string | null = null;
  private pending: Promise<void> | null = null;
  private searchTicket = 0;
  private lookupTicket = 0;

  constructor() {
    this.tenant = untracked(() => this.tenantKey());
    effect(() => {
      const key = this.tenantKey();
      if (key === null) return;
      untracked(() => {
        if (this.tenant !== null && this.tenant !== key) this.forget();
        this.tenant = key;
      });
    });
  }

  private tenantKey(): string | null {
    const session = this.sessionStore.session();
    return session === null
      ? null
      : `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
  }

  private forget(): void {
    this.pending = null;
    this.lists.set([]);
    this.loaded.set(false);
    this.error.set(null);
    this.clearLookup();
  }

  open(): Promise<void> {
    this.pending ??= this.load();
    return this.pending;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      this.lists.set(await api.catalog.priceLists());
      this.loaded.set(true);
    } catch (error) {
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      // A refused read leaves nothing of the last answer: the lists a reader
      // may no longer see are not the lists that are there (PM-01).
      this.lists.set([]);
      this.loaded.set(false);
      this.clearLookup();
      this.error.set(isApiError(error) ? error.message : 'The price lists could not be loaded');
      this.pending = null;
    } finally {
      this.loading.set(false);
    }
  }

  reload(): Promise<void> {
    this.pending = this.load();
    return this.pending;
  }

  /** The backend refuses a one-character query (§71.2); one character is no search yet. */
  async search(text: string): Promise<void> {
    this.query.set(text);
    const trimmed = text.trim();
    const ticket = ++this.searchTicket;
    if (trimmed.length < 2) {
      this.matches.set([]);
      this.searching.set(false);
      return;
    }
    this.searching.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.catalog.skus({ q: trimmed, page: 1, pageSize: 25, sort: 'sku' }),
        null,
      );
      if (ticket !== this.searchTicket) return;
      this.matches.set(answer?.data.slice(0, 10) ?? []);
    } finally {
      if (ticket === this.searchTicket) this.searching.set(false);
    }
  }

  async choose(skuId: string | null): Promise<void> {
    this.chosenId.set(skuId);
    this.lookupError.set(null);
    const ticket = ++this.lookupTicket;
    if (skuId === null) {
      this.chosen.set(null);
      return;
    }
    this.chosen.set(null);
    this.pricing.set(true);
    try {
      const api = await this.backend.ready();
      const detail = await api.catalog.sku(skuId);
      if (ticket !== this.lookupTicket) return;
      this.chosen.set(detail);
    } catch (error) {
      if (ticket !== this.lookupTicket) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.lookupError.set(isApiError(error) ? error.message : 'The SKU could not be read');
    } finally {
      if (ticket === this.lookupTicket) this.pricing.set(false);
    }
  }

  clearLookup(): void {
    this.lookupTicket++;
    this.query.set('');
    this.matches.set([]);
    this.chosenId.set(null);
    this.chosen.set(null);
    this.lookupError.set(null);
    this.pricing.set(false);
    this.searching.set(false);
  }
}
