import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { InvoiceListItem, NexoraApi, PaymentMethod } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { formatMoney } from '../catalog/catalog.model';
import { fieldErrors, INVENTORY_CONFLICTS, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import { CreditMemosStore } from './credit-memos.store';
import { classifyFinance, type CreditMemoDetail } from './finance.model';
import { InvoicesStore } from './invoices.store';

export type CreditMemoBusy = 'open' | 'apply' | 'refund' | 'void';
export type CreditMemoCommand = 'open' | 'apply' | 'refund' | 'void';

/** The methods a refund leaves by; Pix and boleto are the Brazil region's, for a memo in reais. */
export function refundMethods(currency: string): readonly PaymentMethod[] {
  const methods: PaymentMethod[] = ['ach', 'wire', 'check', 'credit_card', 'other'];
  return currency === 'BRL' ? ['pix', 'boleto', ...methods] : methods;
}

/** The codes after which the memo or its invoices moved under the reader: the page reads them again (ER-02). */
const READ_AGAIN = new Set([
  ...INVENTORY_CONFLICTS,
  'INVALID_STATE_TRANSITION',
  'CREDIT_EXCEEDED',
  'INVOICE_ALREADY_PAID',
]);

const cents = (value: number | null): number => Math.round((value ?? 0) * 100);

/**
 * One credit memo (§66.11) with its applications and refunds (§66.12), and the
 * commands its state allows the reader. The apply and the refund are forms
 * written in the memo's own tabs; each applies the backend's limits as the
 * reader types (FM-11): an application never exceeds the memo's unapplied
 * credit nor the invoice's outstanding, a refund never the unapplied credit.
 * Every command carries the version the page read (ER-03).
 */
@Injectable({ providedIn: 'root' })
export class CreditMemoStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly list = inject(CreditMemosStore);
  private readonly invoiceList = inject(InvoicesStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<CreditMemoDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<CreditMemoBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  /** The customer's open invoices in the memo's currency that still owe: where the credit can go. */
  readonly invoices = signal<readonly InvoiceListItem[] | null>(null);

  readonly applyInvoiceId = signal<string | null>(null);
  readonly applyAmount = signal<number | null>(null);
  readonly applyErrors = signal<FormErrors>({});

  readonly refundAmount = signal<number | null>(null);
  readonly refundMethod = signal<PaymentMethod | null>(null);
  readonly refundReason = signal('');
  readonly refundErrors = signal<FormErrors>({});

  private sequence = 0;
  private version = 0;

  readonly memo = computed(() => this.detail()?.creditMemo ?? null);

  readonly activeApplications = computed(() =>
    (this.detail()?.applications ?? []).filter((application) => application.status === 'active'),
  );
  readonly postedRefunds = computed(() =>
    (this.detail()?.refunds ?? []).filter((refund) => refund.status === 'posted'),
  );
  readonly appliedMinor = computed(() =>
    this.activeApplications().reduce((sum, application) => sum + application.amount.minor, 0),
  );
  readonly refundedMinor = computed(() =>
    this.postedRefunds().reduce((sum, refund) => sum + refund.amount.minor, 0),
  );

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  /** The commands this state allows and this reader holds, in the order they are read (RP-09). */
  readonly commands = computed<readonly CreditMemoCommand[]>(() => {
    const memo = this.memo();
    if (memo === null) return [];
    const commands: CreditMemoCommand[] = [];
    const credit = memo.unappliedAmount.minor > 0;
    if (memo.lifecycle === 'draft' && this.can('credit_memos.open')) commands.push('open');
    if (memo.lifecycle === 'open' && credit && this.can('credit_memos.open')) commands.push('apply');
    if (memo.lifecycle === 'open' && credit && this.can('refunds.create')) commands.push('refund');
    // `void` takes a draft, or an open memo nothing was applied from — a refund counts as applied.
    if (
      (memo.lifecycle === 'draft' || (memo.lifecycle === 'open' && memo.appliedAmount.minor === 0)) &&
      this.can('credit_memos.open')
    )
      commands.push('void');
    return commands;
  });

  readonly chosenInvoice = computed(
    () => this.invoices()?.find((invoice) => invoice.id === this.applyInvoiceId()) ?? null,
  );

  /** §66.11: an application never exceeds the memo's unapplied credit nor the invoice's outstanding. */
  readonly applyLimitMinor = computed(() => {
    const memo = this.memo();
    const invoice = this.chosenInvoice();
    if (memo === null || invoice === null) return null;
    return Math.min(memo.unappliedAmount.minor, invoice.outstanding.minor);
  });

  /** The limits, applied as the reader types (FM-11). */
  readonly applyTyped = computed((): FormErrors => {
    const limit = this.applyLimitMinor();
    const amount = this.applyAmount();
    const memo = this.memo();
    if (limit === null || amount === null || memo === null) return {};
    if (cents(amount) <= 0) return { amountMinor: ['An application is more than nothing.'] };
    if (cents(amount) > limit) {
      const invoice = this.chosenInvoice()!;
      const bound =
        limit === memo.unappliedAmount.minor
          ? `the ${formatMoney(memo.unappliedAmount)} of credit the memo still holds`
          : `the ${formatMoney(invoice.outstanding)} ${invoice.invoiceNumber ?? 'the invoice'} still owes`;
      return { amountMinor: [`At most ${formatMoney({ currency: memo.currency, minor: limit })}: ${bound}.`] };
    }
    return {};
  });

  /** §66.12: a refund never exceeds the credit the memo still holds. */
  readonly refundTyped = computed((): FormErrors => {
    const memo = this.memo();
    const amount = this.refundAmount();
    if (memo === null || amount === null) return {};
    if (cents(amount) <= 0) return { amountMinor: ['A refund is more than nothing.'] };
    if (cents(amount) > memo.unappliedAmount.minor)
      return {
        amountMinor: [`At most ${formatMoney(memo.unappliedAmount)}: the credit the memo still holds.`],
      };
    return {};
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.error.set(null);
      this.failure.set(null);
      this.invoices.set(null);
      this.resetForms();
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
      const detail = await api.finance.creditMemos.get(id);
      if (ticket !== this.sequence) return;
      this.version = detail.creditMemo.metadata.version;
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The credit memo could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The customer's invoices the credit can go to, read when the apply form opens. */
  async loadInvoices(): Promise<void> {
    const memo = this.memo();
    if (memo === null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () =>
        api.finance.invoices.list({
          pageSize: 100,
          sort: 'dueDate',
          filter: { customerId: { eq: memo.customerId }, lifecycle: { eq: 'open' }, currency: { eq: memo.currency } },
        }),
      null,
    );
    if (answer === null) return;
    const owing = answer.data.filter((invoice) => invoice.outstanding.minor > 0);
    this.invoices.set(owing);
    const preferred = owing.find((invoice) => invoice.id === memo.sourceInvoiceId) ?? owing[0];
    if (this.applyInvoiceId() === null && preferred) this.chooseInvoice(preferred.id);
  }

  chooseInvoice(id: string | null): void {
    this.applyInvoiceId.set(id);
    const limit = this.applyLimitMinor();
    this.applyAmount.set(limit === null ? null : limit / 100);
    this.applyErrors.set({});
  }

  startRefund(): void {
    const memo = this.memo();
    if (memo === null) return;
    if (this.refundAmount() === null) this.refundAmount.set(memo.unappliedAmount.minor / 100);
    if (this.refundMethod() === null) this.refundMethod.set(refundMethods(memo.currency)[0]!);
  }

  resetForms(): void {
    this.applyInvoiceId.set(null);
    this.applyAmount.set(null);
    this.applyErrors.set({});
    this.refundAmount.set(null);
    this.refundMethod.set(null);
    this.refundReason.set('');
    this.refundErrors.set({});
  }

  openMemo(): Promise<boolean> {
    return this.run('open', (api, id, version) => api.finance.creditMemos.open(id, { ifMatch: version }));
  }

  voidMemo(): Promise<boolean> {
    return this.run('void', (api, id, version) => api.finance.creditMemos.void(id, { ifMatch: version }));
  }

  async apply(): Promise<boolean> {
    const invoiceId = this.applyInvoiceId();
    const errors: Record<string, string[]> = {};
    if (invoiceId === null) errors['invoiceId'] = ['Choose the invoice the credit goes to.'];
    if (this.applyAmount() === null) errors['amountMinor'] = ['Say how much of the credit is applied.'];
    Object.assign(errors, this.applyTyped());
    if (Object.keys(errors).length > 0) {
      this.applyErrors.set(errors);
      return false;
    }
    const amountMinor = cents(this.applyAmount());
    const ok = await this.run(
      'apply',
      (api, id, version) =>
        api.finance.creditMemos.apply(id, { invoiceId: invoiceId!, amountMinor }, { ifMatch: version }),
      (error) => this.applyErrors.set(fieldErrors(error)),
    );
    if (ok) {
      this.applyInvoiceId.set(null);
      this.applyAmount.set(null);
      this.invoices.set(null);
    } else if (this.failure()?.kind !== 'transport') void this.loadInvoices();
    return ok;
  }

  async refund(): Promise<boolean> {
    const memo = this.memo();
    if (memo === null) return false;
    const errors: Record<string, string[]> = {};
    if (this.refundAmount() === null) errors['amountMinor'] = ['Say how much is refunded.'];
    if (this.refundMethod() === null) errors['method'] = ['Choose how the refund leaves.'];
    if (this.refundReason().trim().length === 0)
      errors['reason'] = ['Say why the credit is refunded rather than applied: the refund keeps it.'];
    Object.assign(errors, this.refundTyped());
    if (Object.keys(errors).length > 0) {
      this.refundErrors.set(errors);
      return false;
    }
    const input = {
      customerId: memo.customerId,
      creditMemoId: memo.id,
      amountMinor: cents(this.refundAmount()),
      method: this.refundMethod()!,
      reason: this.refundReason().trim(),
    };
    const ok = await this.run(
      'refund',
      (api) => api.finance.refunds.create(input),
      (error) => this.refundErrors.set(fieldErrors(error)),
    );
    if (ok) {
      this.refundAmount.set(null);
      this.refundMethod.set(null);
      this.refundReason.set('');
    }
    return ok;
  }

  private async run(
    kind: CreditMemoBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
    onError?: (error: unknown) => void,
  ): Promise<boolean> {
    const memo = this.memo();
    if (memo === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, memo.id, this.version));
      await this.load();
      if (this.list.total() !== null) void this.list.reload();
      if (kind === 'apply' && this.invoiceList.total() !== null) void this.invoiceList.reload();
      return true;
    } catch (error) {
      const failure = classifyFinance(error, 'The credit memo was not changed.');
      this.failure.set(failure);
      onError?.(error);
      if (isApiError(error) && READ_AGAIN.has(error.code)) await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }
}
