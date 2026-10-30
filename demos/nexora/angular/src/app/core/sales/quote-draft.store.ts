import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { CustomerListItem, QuoteDetail, SkuListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';

export interface DraftLine {
  skuId: string;
  skuCode: string;
  skuName: string;
  /** Decimal text, as §53.8 stores a quantity. */
  quantity: string;
  discountBps: number;
  /** What the catalog asks for the SKU; the price the quote carries is the backend's. */
  listPriceMinor?: number;
  available: string;
}

/** The words the screen says for a refusal the backend states by code. */
const WORDS: Record<string, string> = {
  PRIMARY_CONTACT_REQUIRED:
    'This account has no active contact, and a quote is written to a person. Add one on the account first.',
  CUSTOMER_INACTIVE: 'This account cannot receive quotes while it is inactive or closed.',
  SKU_DISCONTINUED: 'One of these items is discontinued and cannot be quoted.',
  PRICE_NOT_FOUND: 'One of these items has no price on the account’s price list.',
  QUANTITY_PRECISION_EXCEEDED: 'A quantity carries more decimals than the item is sold in.',
};

/**
 * A quote being written (§58.1): the account, the people it is for, and the
 * lines. The prices are the backend's — the draft carries what the catalog
 * asks, so the reader sees the order of magnitude before the command runs and
 * the quote's own totals after it.
 */
@Injectable({ providedIn: 'root' })
export class QuoteDraftStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);

  readonly customer = signal<CustomerListItem | null>(null);
  readonly customerQuery = signal('');
  readonly customerOptions = signal<readonly CustomerListItem[]>([]);
  readonly searchingCustomers = signal(false);

  readonly lines = signal<readonly DraftLine[]>([]);
  readonly skuQuery = signal('');
  readonly skuOptions = signal<readonly SkuListItem[]>([]);
  readonly searchingSkus = signal(false);

  readonly expirationDate = signal('');
  readonly freight = signal<number | null>(null);
  readonly notes = signal('');

  readonly errors = signal<FormErrors>({});
  readonly failure = signal<{ code: string; message: string } | null>(null);
  readonly creating = signal(false);

  readonly ready = computed(() => this.customer() !== null && this.lines().length > 0);
  readonly estimate = computed(() =>
    this.lines().reduce((sum, line) => {
      const price = line.listPriceMinor ?? 0;
      const net = price * (1 - line.discountBps / 10_000);
      return sum + net * Number(line.quantity || '0');
    }, 0),
  );

  private customerTicket = 0;
  private skuTicket = 0;

  /** The account the quote is for; changing it empties the lines, which were priced for another. */
  choose(customer: CustomerListItem | null): void {
    this.customer.set(customer);
    this.errors.set({});
    this.failure.set(null);
  }

  async searchCustomers(query: string): Promise<void> {
    this.customerQuery.set(query);
    const ticket = ++this.customerTicket;
    if (query.trim().length < 2) {
      this.customerOptions.set([]);
      return;
    }
    this.searchingCustomers.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.customers.list({ q: query.trim(), pageSize: 25, sort: 'displayName' }),
        null,
      );
      if (ticket !== this.customerTicket || answer === null) return;
      this.customerOptions.set(answer.data);
    } finally {
      if (ticket === this.customerTicket) this.searchingCustomers.set(false);
    }
  }

  async searchSkus(query: string): Promise<void> {
    this.skuQuery.set(query);
    const ticket = ++this.skuTicket;
    if (query.trim().length < 2) {
      this.skuOptions.set([]);
      return;
    }
    this.searchingSkus.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.catalog.skus({ q: query.trim(), pageSize: 25, sort: 'sku' }),
        null,
      );
      if (ticket !== this.skuTicket || answer === null) return;
      this.skuOptions.set(answer.data.filter((sku) => sku.status !== 'discontinued'));
    } finally {
      if (ticket === this.skuTicket) this.searchingSkus.set(false);
    }
  }

  addLine(sku: SkuListItem, quantity: string, discountBps = 0): void {
    const line: DraftLine = {
      skuId: sku.id,
      skuCode: sku.sku,
      skuName: sku.name,
      quantity,
      discountBps,
      available: sku.available,
      ...(sku.listPrice ? { listPriceMinor: sku.listPrice.minor } : {}),
    };
    // One row per SKU: the same item twice is one line with more of it.
    const existing = this.lines().findIndex((candidate) => candidate.skuId === sku.id);
    this.lines.update((lines) =>
      existing < 0
        ? [...lines, line]
        : lines.map((candidate, index) =>
            index === existing
              ? {
                  ...candidate,
                  quantity: String(Number(candidate.quantity) + Number(quantity)),
                  discountBps,
                }
              : candidate,
          ),
    );
  }

  patchLine(skuId: string, patch: Partial<DraftLine>): void {
    this.lines.update((lines) =>
      lines.map((line) => (line.skuId === skuId ? { ...line, ...patch } : line)),
    );
  }

  removeLine(skuId: string): void {
    this.lines.update((lines) => lines.filter((line) => line.skuId !== skuId));
  }

  reset(): void {
    this.customer.set(null);
    this.customerQuery.set('');
    this.customerOptions.set([]);
    this.lines.set([]);
    this.skuQuery.set('');
    this.skuOptions.set([]);
    this.expirationDate.set('');
    this.freight.set(null);
    this.notes.set('');
    this.errors.set({});
    this.failure.set(null);
  }

  /** Writes the quote and answers with it; the draft is emptied only on the answer. */
  async create(): Promise<QuoteDetail | null> {
    const customer = this.customer();
    if (customer === null || this.creating()) return null;
    this.creating.set(true);
    this.errors.set({});
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await this.health.mutation(() =>
        api.quotes.create({
          customerId: customer.id,
          lines: this.lines().map((line) => ({
            skuId: line.skuId,
            quantity: line.quantity,
            ...(line.discountBps > 0 ? { discountBps: line.discountBps } : {}),
          })),
          ...(this.expirationDate() ? { expirationDate: this.expirationDate() } : {}),
          ...(this.freight() === null ? {} : { freightMinor: Math.round(this.freight()! * 100) }),
          ...(this.notes().trim() ? { notes: this.notes() } : {}),
        }),
      );
      this.reset();
      return detail;
    } catch (error) {
      if (isApiError(error, 'VALIDATION_FAILED') && (error.fieldErrors?.length ?? 0) > 0) {
        const map: Record<string, string[]> = {};
        for (const field of error.fieldErrors ?? [])
          map[field.field] = [...(map[field.field] ?? []), field.message];
        this.errors.set(map);
      } else if (isApiError(error)) {
        this.failure.set({ code: error.code, message: WORDS[error.code] ?? error.message });
      } else {
        this.failure.set({ code: 'UNKNOWN', message: 'The quote was not written.' });
      }
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}
