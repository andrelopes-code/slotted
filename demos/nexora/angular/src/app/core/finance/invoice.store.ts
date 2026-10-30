import { computed, inject, Injectable, signal } from '@angular/core';
import type { CustomerDetail, CustomerNote, NexoraApi } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { INVENTORY_CONFLICTS, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import {
  classifyFinance,
  isFinanceManager,
  writeOffRule,
  type CreditMemoListItem,
  type InvoiceDetail,
  type WriteOffRule,
} from './finance.model';
import { InvoicesStore } from './invoices.store';

export type InvoiceBusy =
  | 'open'
  | 'send'
  | 'dispute'
  | 'resolve'
  | 'void'
  | 'writeOff'
  | 'decision'
  | 'contact'
  | 'credit'
  | 'save';

/** The commands an invoice offers, each only in the state the backend accepts it (RP-09). */
export type InvoiceCommand =
  | 'edit'
  | 'open'
  | 'send'
  | 'dispute'
  | 'resolve'
  | 'void'
  | 'writeOff'
  | 'contact'
  | 'payment'
  | 'credit'
  | 'creditMemo';

/**
 * A contact attempt is a customer note (§47 "a finance manager has added a
 * collection note"): the backend has no collection command, and a note is the
 * record Customer 360 already reads. The body starts with this prefix and the
 * invoice's number, which is how the invoice finds its own attempts.
 */
export const CONTACT_ATTEMPT_PREFIX = 'Contact attempt';

export function contactAttemptPrefix(invoiceNumber: string): string {
  return `${CONTACT_ATTEMPT_PREFIX} · ${invoiceNumber} · `;
}

export const CONTACT_CHANNELS = ['Phone', 'Email', 'Letter', 'In person'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

/** One contact attempt read back out of its note. */
export interface ContactAttempt {
  readonly id: string;
  readonly channel: string;
  readonly said: string;
  readonly at: string;
  readonly authorName: string | null;
}

/**
 * One invoice (§66): its lines, what paid or credited it, its collection
 * notes, a write-off's approval, and the commands the reader's permissions
 * allow in its state. Every command carries the version the page read, held
 * as a number (ER-03); a refusal is classed before it is shown (ER-01), and a
 * conflict reads the invoice again (ER-02).
 */
@Injectable({ providedIn: 'root' })
export class InvoiceStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly list = inject(InvoicesStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<InvoiceDetail | null>(null);
  /** The customer's contacts and notes; null until read, or where the read failed. */
  readonly customer = signal<CustomerDetail | null>(null);
  /** The customer's open credit memos in the invoice's currency with credit left, for Apply credit. */
  readonly openCredits = signal<readonly CreditMemoListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<InvoiceBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  private sequence = 0;
  private version = 0;
  private approvalVersion = 0;
  /** Each open credit memo's version as the page read it, held as a number (ER-03). */
  private creditVersions = new Map<string, number>();

  readonly invoice = computed(() => this.detail()?.invoice ?? null);
  readonly approval = computed(() => this.detail()?.approval ?? null);
  readonly today = computed(() => this.session.session()?.demo.today ?? '');

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  readonly canSeePayments = computed(() => this.can('payments.view'));
  readonly canSeeCreditMemos = computed(() => this.can('credit_memos.view'));

  /**
   * `notes.create` is granted at every scope but to a representative, who
   * holds it for their own accounts (§55.5): the backend refuses the note on
   * anyone else's customer, so the control follows the same rule.
   */
  readonly canWriteNote = computed(() => {
    if (!this.can('notes.create')) return false;
    const session = this.session.session();
    const roles = (session?.roles ?? []).map((role) => role.name);
    if (roles.some((role) => role !== 'Sales Representative')) return true;
    return this.customer()?.customer.accountOwnerId === session?.user.id;
  });

  /** §66.5: a payment or a credit still applied keeps the invoice from being voided. */
  readonly hasAllocations = computed(() => {
    const detail = this.detail();
    if (detail === null) return false;
    return (
      detail.allocations.some((allocation) => allocation.status === 'active') ||
      detail.creditApplications.some((application) => application.status === 'active')
    );
  });

  readonly pendingApproval = computed(() => this.approval()?.status === 'pending');

  /** What §66.5 asks of a write-off of the whole balance, said before any control (FM-11). */
  readonly writeOff = computed<WriteOffRule | null>(() => {
    const invoice = this.invoice();
    if (invoice === null || invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0) return null;
    const roles = this.session.session()?.roles ?? [];
    return writeOffRule(invoice, this.can('invoices.write_off'), isFinanceManager(roles));
  });

  /** The commands this state allows and this reader holds, in the order they are read (RP-09). */
  readonly commands = computed<readonly InvoiceCommand[]>(() => {
    const invoice = this.invoice();
    if (invoice === null) return [];
    const commands: InvoiceCommand[] = [];
    if (invoice.lifecycle === 'draft') {
      if (this.can('invoices.open')) commands.push('open');
      if (this.can('invoices.edit_draft')) commands.push('edit');
      return commands;
    }
    if (invoice.lifecycle !== 'open') return commands;
    const owes = invoice.outstanding.minor > 0;
    if (owes && this.can('payments.record')) commands.push('payment');
    if (owes && invoice.invoiceNumber && this.canWriteNote()) commands.push('contact');
    if (this.can('invoices.send')) commands.push('send');
    if (owes && this.openCredits().length > 0 && this.can('credit_memos.open')) commands.push('credit');
    if (this.can('credit_memos.create')) commands.push('creditMemo');
    if (this.can('invoices.edit_draft'))
      commands.push(invoice.collectionState === 'disputed' ? 'resolve' : 'dispute');
    if (owes && !this.pendingApproval() && this.writeOff()?.allowed) commands.push('writeOff');
    if (!this.hasAllocations() && this.can('invoices.void')) commands.push('void');
    return commands;
  });

  /** The contact attempts on this invoice, newest first, read out of the customer's notes. */
  readonly attempts = computed<readonly ContactAttempt[]>(() => {
    const number = this.invoice()?.invoiceNumber;
    const notes = this.customer()?.notes ?? [];
    if (!number) return [];
    const prefix = contactAttemptPrefix(number);
    const names = new Map((this.session.session()?.personas ?? []).map((persona) => [persona.userId, persona.name]));
    return notes
      .filter((note) => note.body.startsWith(prefix))
      .map((note) => attemptOf(note, prefix, names))
      .sort((a, b) => b.at.localeCompare(a.at));
  });

  /** The version the page read, for the forms that travel beside the record's own commands. */
  readVersion(): number {
    return this.version;
  }

  /** A credit memo's version as the page read it. */
  readCreditVersion(memoId: string): number {
    return this.creditVersions.get(memoId) ?? 0;
  }

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.customer.set(null);
      this.openCredits.set([]);
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
      const detail = await api.finance.invoices.get(id);
      if (ticket !== this.sequence) return;
      // The customer's notes and credit land with the invoice, so a tab's count never moves after it.
      const [customer, credits] = await Promise.all([
        this.health.read(() => api.customers.get(detail.invoice.customerId), null).catch(() => null),
        this.readCredits(api, detail),
      ]);
      if (ticket !== this.sequence) return;
      this.version = detail.invoice.metadata.version;
      this.approvalVersion = detail.approval?.metadata.version ?? 0;
      this.creditVersions = new Map(credits.map((memo) => [memo.id, memo.metadata.version]));
      this.customer.set(customer);
      this.openCredits.set(credits);
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The invoice could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  private async readCredits(api: NexoraApi, detail: InvoiceDetail): Promise<readonly CreditMemoListItem[]> {
    const invoice = detail.invoice;
    if (invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0 || !this.can('credit_memos.view'))
      return [];
    const answer = await this.health
      .read(
        () =>
          api.finance.creditMemos.list({
            pageSize: 100,
            filter: { customerId: { eq: invoice.customerId }, lifecycle: { eq: 'open' } },
          }),
        null,
      )
      .catch(() => null);
    return (answer?.data ?? []).filter(
      (memo) => memo.currency === invoice.currency && memo.unappliedAmount.minor > 0,
    );
  }

  openInvoice(): Promise<boolean> {
    return this.run('open', (api, id, version) => api.finance.invoices.open(id, { ifMatch: version }));
  }

  send(): Promise<boolean> {
    return this.run('send', (api, id, version) => api.finance.invoices.send(id, { ifMatch: version }));
  }

  dispute(reason: string): Promise<boolean> {
    return this.run('dispute', (api, id, version) =>
      api.finance.invoices.dispute(id, { reason }, { ifMatch: version }),
    );
  }

  resolveDispute(): Promise<boolean> {
    return this.run('resolve', (api, id, version) =>
      api.finance.invoices.resolveDispute(id, { ifMatch: version }),
    );
  }

  void(reason: string): Promise<boolean> {
    return this.run('void', (api, id, version) =>
      api.finance.invoices.void(id, { reason }, { ifMatch: version }),
    );
  }

  /** Writes the whole balance off, or asks for the approval §66.5 requires above US$5,000. */
  requestWriteOff(reason: string): Promise<boolean> {
    return this.run('writeOff', (api, id, version) =>
      api.finance.invoices.writeOff(id, { reason }, { ifMatch: version }),
    );
  }

  /** The write-off's approval, decided from the invoice with the approval's own version (§67). */
  async decide(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<boolean> {
    const approval = this.approval();
    if (approval === null || this.busy() !== null) return false;
    this.busy.set('decision');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const version = this.approvalVersion;
      await this.health.mutation(() => {
        if (decision === 'approve')
          return api.approvals.approve(approval.id, reason ? { comment: reason } : {}, { ifMatch: version });
        if (decision === 'reject') return api.approvals.reject(approval.id, { reason }, { ifMatch: version });
        return api.approvals.requestChanges(approval.id, { reason }, { ifMatch: version });
      });
      await this.load();
      this.refreshList();
      return true;
    } catch (error) {
      this.failure.set(classifyFinance(error, 'The decision was not recorded.'));
      await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  /**
   * Runs a command the page holds beside the record — the edit, a note, a
   * credit — with the version the page read, and reads the invoice back.
   */
  async write<T>(
    kind: InvoiceBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<T>,
  ): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
    const invoice = this.invoice();
    if (invoice === null || this.busy() !== null) return { ok: false, error: null };
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const value = await this.health.mutation(() => action(api, invoice.id, this.version));
      await this.load();
      this.refreshList();
      return { ok: true, value };
    } catch (error) {
      if (
        isApiError(error) &&
        (INVENTORY_CONFLICTS.has(error.code) ||
          error.code === 'INVALID_STATE_TRANSITION' ||
          error.code === 'INVOICE_HAS_ALLOCATIONS' ||
          error.code === 'APPROVAL_REQUIRED')
      )
        await this.load();
      return { ok: false, error };
    } finally {
      this.busy.set(null);
    }
  }

  private async run(
    kind: InvoiceBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const result = await this.write(kind, action);
    if (result.ok) return true;
    if (result.error !== null) this.failure.set(classifyFinance(result.error, 'The invoice was not changed.'));
    return false;
  }

  private refreshList(): void {
    if (this.list.total() !== null) void this.list.reload();
  }
}

function attemptOf(note: CustomerNote, prefix: string, names: ReadonlyMap<string, string>): ContactAttempt {
  const rest = note.body.slice(prefix.length);
  const colon = rest.indexOf(': ');
  return {
    id: note.id,
    channel: colon > 0 ? rest.slice(0, colon) : 'Contact',
    said: colon > 0 ? rest.slice(colon + 2) : rest,
    at: note.metadata.createdAt,
    authorName: names.get(note.authorId) ?? null,
  };
}
