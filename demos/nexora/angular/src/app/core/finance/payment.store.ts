import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { NexoraApi, PaymentMethod } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { fieldErrors, INVENTORY_CONFLICTS, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import { classifyFinance, type PaymentDetail, type RefundListItem } from './finance.model';
import { InvoicesStore } from './invoices.store';
import {
  ALLOCATIONS_KEY,
  allocationErrors,
  allocationsOf,
  openInvoicesOf,
  type AllocationLine,
} from './payment-allocation';
import { PaymentsStore } from './payments.store';

export type PaymentBusy = 'allocate' | 'reverse' | 'refund';

/** The refund written from a payment's unapplied amount (§66.12). */
export interface RefundDraft {
  readonly amount: number | null;
  readonly method: PaymentMethod;
  readonly reason: string;
}

/**
 * One payment (§66.7–§66.10): what it brought, the invoices it went to, what
 * stays unapplied, and the commands its state allows the reader. Every command
 * carries the version the page read, held as a number (ER-03); a refusal is
 * classed before it is shown (ER-01) and a conflict reads the payment again
 * (ER-02).
 */
@Injectable({ providedIn: 'root' })
export class PaymentStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly list = inject(PaymentsStore);
  private readonly invoices = inject(InvoicesStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<PaymentDetail | null>(null);
  readonly refunds = signal<readonly RefundListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<PaymentBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  /** The allocation written in place: the customer's open invoices in the payment's currency. */
  readonly lines = signal<readonly AllocationLine[] | null>(null);
  readonly otherCurrency = signal(0);
  readonly allocationServerErrors = signal<FormErrors>({});
  readonly refundDraft = signal<RefundDraft>({ amount: null, method: 'ach', reason: '' });
  readonly refundErrors = signal<FormErrors>({});

  private sequence = 0;
  private version = 0;

  readonly payment = computed(() => this.detail()?.payment ?? null);

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  readonly posted = computed(() => this.payment()?.status === 'posted');
  readonly unappliedMinor = computed(() => this.payment()?.unappliedAmount.minor ?? 0);
  /**
   * The customer's open invoices in the payment's currency, counted when the payment has something
   * left to give: with none, no allocation can succeed and none is offered (RP-09). Null before the read.
   */
  readonly openInvoices = signal<number | null>(null);
  readonly canAllocate = computed(
    () => this.posted() && this.unappliedMinor() > 0 && this.can('payments.record') && (this.openInvoices() ?? 0) > 0,
  );
  readonly canReverse = computed(() => this.posted() && this.can('payments.reverse'));
  readonly canRefund = computed(() => this.posted() && this.unappliedMinor() > 0 && this.can('refunds.create'));

  /** The limits of §66.8 as the reader types, with the backend's own refusal kept beside them. */
  readonly allocationErrors = computed<FormErrors>(() => ({
    ...this.allocationServerErrors(),
    ...allocationErrors(this.lines() ?? [], this.unappliedMinor()),
  }));

  /** §66.12: a refund from a payment takes no more than what the payment left unapplied. */
  readonly refundLimitErrors = computed<FormErrors>(() => {
    const amount = Math.round((this.refundDraft().amount ?? 0) * 100);
    const payment = this.payment();
    const none: FormErrors = {};
    if (payment === null || amount <= this.unappliedMinor()) return none;
    return {
      amountMinor: [
        `A refund from this payment is at most what it left unapplied, ${new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.unappliedAmount.currency }).format(this.unappliedMinor() / 100)}.`,
      ],
    };
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.refunds.set([]);
      this.lines.set(null);
      this.openInvoices.set(null);
      this.error.set(null);
      this.failure.set(null);
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
      const [detail, refunds] = await Promise.all([
        api.finance.payments.get(id),
        this.can('credit_memos.view')
          ? this.health.read(() => api.finance.refunds.list(), [] as RefundListItem[])
          : Promise.resolve([] as RefundListItem[]),
      ]);
      if (ticket !== this.sequence) return;
      const { payment } = detail;
      const open =
        payment.status === 'posted' && payment.unappliedAmount.minor > 0 && this.can('payments.record')
          ? await openInvoicesOf(api, this.health, payment.customerId, payment.amount.currency)
          : null;
      if (ticket !== this.sequence) return;
      this.openInvoices.set(open === null ? 0 : open.lines.length);
      this.version = detail.payment.metadata.version;
      this.refunds.set(refunds.filter((refund) => refund.paymentId === id));
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The payment could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** Reads the customer's open invoices the allocation can go to; a line's typing is kept across reads. */
  async startAllocation(): Promise<void> {
    const payment = this.payment();
    if (payment === null || this.lines() !== null) return;
    const api = await this.backend.ready();
    const answer = await openInvoicesOf(api, this.health, payment.customerId, payment.amount.currency);
    if (answer === null || this.payment()?.id !== payment.id) return;
    this.lines.set(answer.lines);
    this.otherCurrency.set(answer.otherCurrency);
  }

  private async rereadLines(): Promise<void> {
    const payment = this.payment();
    const typed = new Map((this.lines() ?? []).map((line) => [line.invoiceId, line.amount]));
    if (payment === null) return;
    const api = await this.backend.ready();
    const answer = await openInvoicesOf(api, this.health, payment.customerId, payment.amount.currency);
    if (answer === null) return;
    this.lines.set(answer.lines.map((line) => ({ ...line, amount: typed.get(line.invoiceId) ?? null })));
    this.otherCurrency.set(answer.otherCurrency);
  }

  setLine(invoiceId: string, amount: number | null): void {
    this.lines.update((lines) => lines?.map((line) => (line.invoiceId === invoiceId ? { ...line, amount } : line)) ?? null);
    this.allocationServerErrors.set({});
  }

  /** Gives each invoice, oldest due first, what it owes until the unapplied amount runs out. */
  fillOldestFirst(): void {
    let left = this.unappliedMinor();
    this.lines.update(
      (lines) =>
        lines?.map((line) => {
          const give = Math.min(left, line.outstandingMinor);
          left -= give;
          return { ...line, amount: give > 0 ? give / 100 : null };
        }) ?? null,
    );
    this.allocationServerErrors.set({});
  }

  cancelAllocation(): void {
    this.lines.set(null);
    this.allocationServerErrors.set({});
  }

  async allocate(): Promise<boolean> {
    const lines = this.lines() ?? [];
    const allocations = allocationsOf(lines);
    if (allocations.length === 0) {
      this.allocationServerErrors.set({ [ALLOCATIONS_KEY]: ['Give at least one invoice an amount.'] });
      return false;
    }
    if (Object.keys(allocationErrors(lines, this.unappliedMinor())).length > 0) return false;
    const result = await this.write('allocate', (api, id, version) =>
      api.finance.payments.allocate(id, { allocations }, { ifMatch: version }),
    );
    if (result.ok) {
      this.lines.set(null);
      return true;
    }
    if (isApiError(result.error) && result.error.code.startsWith('ALLOCATION_'))
      this.allocationServerErrors.set({ [ALLOCATIONS_KEY]: [classifyFinance(result.error, '').message] });
    return false;
  }

  async reverse(reason: string): Promise<boolean> {
    const result = await this.write('reverse', (api, id, version) =>
      api.finance.payments.reverse(id, { reason }, { ifMatch: version }),
    );
    return result.ok;
  }

  patchRefund(patch: Partial<RefundDraft>): void {
    this.refundDraft.update((draft) => ({ ...draft, ...patch }));
    this.refundErrors.set({});
  }

  startRefund(): void {
    const payment = this.payment();
    if (payment === null) return;
    const draft = this.refundDraft();
    if (draft.amount === null) this.refundDraft.set({ ...draft, method: payment.method, amount: this.unappliedMinor() / 100 });
  }

  async refund(): Promise<boolean> {
    const payment = this.payment();
    if (payment === null) return false;
    const draft = this.refundDraft();
    const amountMinor = Math.round((draft.amount ?? 0) * 100);
    const errors: Record<string, string[]> = { ...this.refundLimitErrors() } as Record<string, string[]>;
    if (amountMinor <= 0) errors['amountMinor'] = ['A refund is a positive amount.'];
    if (draft.reason.trim().length === 0) errors['reason'] = ['Say why the money goes back; the refund keeps it.'];
    if (Object.keys(errors).length > 0) {
      this.refundErrors.set(errors);
      return false;
    }
    this.busy.set('refund');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.finance.refunds.create({
          customerId: payment.customerId,
          paymentId: payment.id,
          amountMinor,
          method: draft.method,
          reason: draft.reason.trim(),
        }),
      );
      this.refundDraft.set({ amount: null, method: payment.method, reason: '' });
      await this.load();
      this.refreshLists();
      return true;
    } catch (error) {
      this.refundErrors.set(fieldErrors(error));
      this.failure.set(classifyFinance(error, 'The refund was not written.'));
      if (isApiError(error) && error.code === 'CREDIT_EXCEEDED') await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  private async write<T>(
    kind: PaymentBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<T>,
  ): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
    const payment = this.payment();
    if (payment === null || this.busy() !== null) return { ok: false, error: null };
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const value = await this.health.mutation(() => action(api, payment.id, this.version));
      await this.load();
      this.refreshLists();
      return { ok: true, value };
    } catch (error) {
      this.failure.set(classifyFinance(error, 'The payment was not changed.'));
      if (
        isApiError(error) &&
        (INVENTORY_CONFLICTS.has(error.code) ||
          error.code === 'INVALID_STATE_TRANSITION' ||
          error.code === 'PAYMENT_NOT_POSTED' ||
          error.code.startsWith('ALLOCATION_') ||
          error.code === 'INVOICE_ALREADY_PAID')
      ) {
        // The record or one of its invoices moved: what is on screen is read again (ER-02),
        // the allocation's invoices with it, and what the reader typed is kept against them.
        await this.load();
        if (this.lines() !== null) await this.rereadLines();
      }
      return { ok: false, error };
    } finally {
      this.busy.set(null);
    }
  }

  private refreshLists(): void {
    if (this.list.total() !== null) void this.list.reload();
    if (this.invoices.total() !== null) void this.invoices.reload();
  }
}
