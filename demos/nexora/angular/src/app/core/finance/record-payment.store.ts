import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { CurrencyCode, CustomerListItem, PaymentMethod } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import { classifyFinance, type PaymentDetail } from './finance.model';
import { InvoicesStore } from './invoices.store';
import {
  ALLOCATIONS_KEY,
  allocatedMinor,
  allocationErrors,
  allocationsOf,
  openInvoicesOf,
  toMinor,
  type AllocationLine,
} from './payment-allocation';
import { PaymentsStore } from './payments.store';

/** The methods a customer pays by: Pix and boleto are the Brazil region's own (§66.7). */
export function methodsFor(currency: CurrencyCode): PaymentMethod[] {
  const common: PaymentMethod[] = ['ach', 'wire', 'check', 'credit_card', 'other'];
  return currency === 'BRL' ? ['pix', 'boleto', 'wire', 'check', 'credit_card', 'other'] : common;
}

/**
 * The draft of a payment being recorded (§66.9, FM-01, FM-05): whose it is,
 * what it brought, how and when, and which of the customer's open invoices it
 * goes to. It lives here, so a reader who leaves the form finds it again; the
 * answer that records the payment empties it.
 */
@Injectable({ providedIn: 'root' })
export class RecordPaymentStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly payments = inject(PaymentsStore);
  private readonly invoices = inject(InvoicesStore);

  readonly customer = signal<CustomerListItem | null>(null);
  readonly customerQuery = signal('');
  readonly customerOptions = signal<readonly CustomerListItem[]>([]);
  readonly searchingCustomers = signal(false);
  /** In the customer's currency, major units. */
  readonly amount = signal<number | null>(null);
  readonly method = signal<PaymentMethod>('ach');
  readonly receivedDate = signal('');
  readonly reference = signal('');
  readonly lines = signal<readonly AllocationLine[]>([]);
  readonly readingInvoices = signal(false);
  /** The customer's open invoices in another currency, which this payment cannot take (§53.7). */
  readonly otherCurrency = signal(0);
  readonly serverErrors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal(false);

  private customerTicket = 0;
  private invoiceTicket = 0;
  /** The address the draft was opened from, so a door to the same invoice does not reset it. */
  private openedFrom = '';

  /** The payment is recorded in the customer's currency: `payments.record` takes the customer's own. */
  readonly currency = computed<CurrencyCode>(() => this.customer()?.preferredCurrency ?? 'USD');
  readonly methods = computed(() => methodsFor(this.currency()));
  readonly amountMinor = computed(() => toMinor(this.amount()));
  readonly allocated = computed(() => allocatedMinor(this.lines()));
  readonly unapplied = computed(() => Math.max(0, this.amountMinor() - this.allocated()));

  /** One map feeds the summary and every control (FM-03); the limits apply as the reader types (FM-11). */
  readonly errors = computed<FormErrors>(() => ({
    ...this.serverErrors(),
    ...allocationErrors(this.lines(), this.amountMinor()),
  }));

  /**
   * Opens the form from an address: `?customer=<id>` chooses the account and
   * `&invoice=<id>` gives that invoice what it owes, which becomes the amount
   * where none was typed. An address already open keeps what was typed (FM-05).
   */
  async start(customerId: string | null, invoiceId: string | null): Promise<void> {
    if (!this.receivedDate()) this.receivedDate.set(this.session.session()?.demo.today ?? '');
    const key = `${customerId ?? ''}|${invoiceId ?? ''}`;
    if (customerId === null || key === this.openedFrom) return;
    this.openedFrom = key;
    if (this.customer()?.id !== customerId) {
      const api = await this.backend.ready();
      const detail = await this.health.read(() => api.customers.get(customerId), null);
      if (detail === null) return;
      await this.choose(detail.customer);
    }
    if (invoiceId === null) return;
    const line = this.lines().find((candidate) => candidate.invoiceId === invoiceId);
    if (!line) return;
    if (this.amount() === null) this.amount.set(line.outstandingMinor / 100);
    const give = Math.min(line.outstandingMinor, this.amountMinor() - this.allocated() + toMinor(line.amount));
    this.setLine(invoiceId, give > 0 ? give / 100 : null);
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

  /** The account the payment is from; its open invoices in its currency are what the payment can go to. */
  async choose(customer: CustomerListItem | null): Promise<void> {
    this.customer.set(customer);
    this.customerQuery.set(customer?.displayName ?? '');
    this.lines.set([]);
    this.otherCurrency.set(0);
    this.serverErrors.set({});
    this.failure.set(null);
    if (customer === null) return;
    if (!this.methods().includes(this.method())) this.method.set(this.methods()[0]!);
    const ticket = ++this.invoiceTicket;
    this.readingInvoices.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await openInvoicesOf(api, this.health, customer.id, customer.preferredCurrency);
      if (ticket !== this.invoiceTicket || answer === null) return;
      this.lines.set(answer.lines);
      this.otherCurrency.set(answer.otherCurrency);
    } finally {
      if (ticket === this.invoiceTicket) this.readingInvoices.set(false);
    }
  }

  setLine(invoiceId: string, amount: number | null): void {
    this.lines.update((lines) => lines.map((line) => (line.invoiceId === invoiceId ? { ...line, amount } : line)));
    this.dropServer(ALLOCATIONS_KEY);
  }

  /** Gives each invoice, oldest due first, what it owes until the amount runs out. */
  fillOldestFirst(): void {
    let left = this.amountMinor();
    this.lines.update((lines) =>
      lines.map((line) => {
        const give = Math.min(left, line.outstandingMinor);
        left -= give;
        return { ...line, amount: give > 0 ? give / 100 : null };
      }),
    );
    this.dropServer(ALLOCATIONS_KEY);
  }

  setAmount(amount: number | null): void {
    this.amount.set(amount);
    this.dropServer('amountMinor');
  }

  /** The form hands its own map back: a field the reader edited drops the backend's message. */
  acceptErrors(errors: FormErrors): void {
    const kept: Record<string, readonly string[]> = {};
    for (const key of Object.keys(this.serverErrors())) if (errors[key]) kept[key] = errors[key]!;
    this.serverErrors.set(kept);
  }

  private dropServer(key: string): void {
    if (!(key in this.serverErrors())) return;
    const next = { ...this.serverErrors() };
    delete next[key];
    this.serverErrors.set(next);
  }

  reset(): void {
    this.customer.set(null);
    this.customerQuery.set('');
    this.customerOptions.set([]);
    this.amount.set(null);
    this.method.set('ach');
    this.receivedDate.set(this.session.session()?.demo.today ?? '');
    this.reference.set('');
    this.lines.set([]);
    this.otherCurrency.set(0);
    this.serverErrors.set({});
    this.failure.set(null);
    this.openedFrom = '';
  }

  /** Records and posts the payment with its allocations (§66.9); null where nothing was written. */
  async record(): Promise<PaymentDetail | null> {
    const customer = this.customer();
    if (this.creating()) return null;
    const errors: Record<string, string[]> = {};
    if (customer === null) errors['customerId'] = ['Choose the account the payment came from.'];
    if (this.amountMinor() <= 0) errors['amountMinor'] = ['Enter what the payment brought.'];
    if (Object.keys(errors).length > 0 || Object.keys(this.errors()).length > 0) {
      this.serverErrors.set({ ...this.serverErrors(), ...errors });
      return null;
    }
    this.creating.set(true);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const reference = this.reference().trim();
      const allocations = allocationsOf(this.lines());
      const detail = await this.health.mutation(() =>
        api.finance.payments.record({
          customerId: customer!.id,
          amountMinor: this.amountMinor(),
          method: this.method(),
          ...(this.receivedDate() ? { receivedDate: this.receivedDate() } : {}),
          ...(reference ? { reference } : {}),
          ...(allocations.length > 0 ? { allocations } : {}),
        }),
      );
      this.reset();
      if (this.payments.total() !== null) void this.payments.reload();
      if (this.invoices.total() !== null) void this.invoices.reload();
      return detail;
    } catch (error) {
      const failure = classifyFinance(error, 'The payment was not recorded.');
      this.failure.set(failure);
      const map: Record<string, readonly string[]> = { ...fieldErrors(error) };
      if (isApiError(error) && (error.code.startsWith('ALLOCATION_') || error.code === 'INVOICE_ALREADY_PAID')) {
        map[ALLOCATIONS_KEY] = [failure.message];
        // An invoice moved while the form was open: its balance is read again, the typing kept.
        const typed = new Map(this.lines().map((line) => [line.invoiceId, line.amount]));
        const ready = await this.backend.ready();
        const answer = customer
          ? await openInvoicesOf(ready, this.health, customer.id, customer.preferredCurrency)
          : null;
        if (answer) this.lines.set(answer.lines.map((line) => ({ ...line, amount: typed.get(line.invoiceId) ?? null })));
      }
      this.serverErrors.set(map);
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}
