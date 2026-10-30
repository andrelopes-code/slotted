import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  CreditMemoReason,
  CustomerListItem,
  InvoiceListItem,
} from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { CreditMemosStore } from './credit-memos.store';
import { classifyFinance, type CreditMemoListItem } from './finance.model';

const cents = (value: number | null): number => Math.round((value ?? 0) * 100);

/**
 * The draft of a new credit memo (§66.11). It lives in this store, so leaving
 * the form and opening it again finds it (FM-05); a memo written empties it.
 * The memo is written in the customer's own currency, which the form says.
 */
@Injectable({ providedIn: 'root' })
export class CreditMemoDraftStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly list = inject(CreditMemosStore);

  readonly customer = signal<CustomerListItem | null>(null);
  readonly customerQuery = signal('');
  readonly customerOptions = signal<readonly CustomerListItem[]>([]);
  readonly searching = signal(false);
  /** The customer's invoices a memo may name as its source; null before they are read. */
  readonly invoices = signal<readonly InvoiceListItem[] | null>(null);

  readonly reason = signal<CreditMemoReason | null>(null);
  readonly amount = signal<number | null>(null);
  readonly tax = signal<number | null>(null);
  readonly description = signal('');
  readonly sourceInvoiceId = signal<string | null>(null);

  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal(false);

  private ticket = 0;

  readonly currency = computed(() => this.customer()?.preferredCurrency ?? 'USD');
  readonly totalMinor = computed(() => cents(this.amount()) + cents(this.tax()));

  /**
   * Opens the form from a link: `?customer=` and `?invoice=` choose the customer
   * and the invoice the memo corrects. A link naming another customer than the
   * draft holds starts a new draft; otherwise what was typed stays (FM-05).
   */
  async prefill(customerId: string | null, invoiceId: string | null): Promise<void> {
    if (customerId === null || customerId === this.customer()?.id) {
      if (invoiceId !== null && this.customer() !== null) this.sourceInvoiceId.set(invoiceId);
      if (this.customer() !== null && this.invoices() === null) await this.loadInvoices();
      return;
    }
    this.reset();
    const api = await this.backend.ready();
    const answer = await this.health.read(() => api.customers.get(customerId), null);
    if (answer === null) return;
    this.customer.set(answer.customer);
    this.customerQuery.set(answer.customer.displayName);
    this.sourceInvoiceId.set(invoiceId);
    await this.loadInvoices();
  }

  async search(query: string): Promise<void> {
    this.customerQuery.set(query);
    const ticket = ++this.ticket;
    if (query.trim().length < 2) {
      this.customerOptions.set([]);
      return;
    }
    this.searching.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.customers.list({ q: query.trim(), pageSize: 25, sort: 'displayName' }),
        null,
      );
      if (ticket !== this.ticket || answer === null) return;
      this.customerOptions.set(answer.data);
    } finally {
      if (ticket === this.ticket) this.searching.set(false);
    }
  }

  /** Another customer empties the source invoice: it was the other customer's. */
  async choose(customer: CustomerListItem | null): Promise<void> {
    if (customer?.id === this.customer()?.id) return;
    this.customer.set(customer);
    this.customerQuery.set(customer?.displayName ?? '');
    this.sourceInvoiceId.set(null);
    this.invoices.set(null);
    this.errors.update((errors) => {
      const next = { ...errors };
      delete next['customerId'];
      return next;
    });
    if (customer !== null) await this.loadInvoices();
  }

  private async loadInvoices(): Promise<void> {
    const customer = this.customer();
    if (customer === null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () =>
        api.finance.invoices.list({
          pageSize: 50,
          sort: '-issueDate',
          filter: { customerId: { eq: customer.id }, lifecycle: { in: ['open', 'written_off'] } },
        }),
      null,
    );
    if (answer === null || this.customer()?.id !== customer.id) return;
    this.invoices.set(answer.data);
  }

  reset(): void {
    this.customer.set(null);
    this.customerQuery.set('');
    this.customerOptions.set([]);
    this.invoices.set(null);
    this.reason.set(null);
    this.amount.set(null);
    this.tax.set(null);
    this.description.set('');
    this.sourceInvoiceId.set(null);
    this.errors.set({});
    this.failure.set(null);
  }

  /** The platform's own checks, keyed by the backend's names (FM-02, FM-03). */
  private check(): FormErrors {
    const errors: Record<string, string[]> = {};
    if (this.customer() === null) errors['customerId'] = ['Choose the customer the credit is owed to.'];
    if (this.reason() === null) errors['reason'] = ['Choose why the credit is given.'];
    if (cents(this.amount()) <= 0) errors['amountMinor'] = ['A credit memo is for more than nothing.'];
    if (cents(this.tax()) < 0) errors['taxMinor'] = ['Tax is never below zero.'];
    if (this.description().trim().length === 0)
      errors['description'] = ['Say what the credit is for: the memo’s line carries it.'];
    return errors;
  }

  async create(): Promise<CreditMemoListItem | null> {
    const errors = this.check();
    if (Object.keys(errors).length > 0) {
      this.errors.set(errors);
      return null;
    }
    this.creating.set(true);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const tax = cents(this.tax());
      const source = this.sourceInvoiceId();
      const answer = await this.health.mutation(() =>
        api.finance.creditMemos.create({
          customerId: this.customer()!.id,
          reason: this.reason()!,
          amountMinor: cents(this.amount()),
          ...(tax > 0 ? { taxMinor: tax } : {}),
          description: this.description().trim(),
          ...(source ? { sourceInvoiceId: source } : {}),
        }),
      );
      this.reset();
      if (this.list.total() !== null) void this.list.reload();
      return answer.creditMemo;
    } catch (error) {
      this.failure.set(classifyFinance(error, 'The credit memo was not written.'));
      this.errors.set(fieldErrors(error));
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}
