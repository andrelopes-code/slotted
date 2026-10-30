import { computed, inject, Injectable, signal } from '@angular/core';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, type GridQuery } from '@slotted/core/grid';
import type {
  BankMatchCandidate,
  InvoiceListItem,
  ListQuery,
  ListResponse,
  Money,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { LIST_PAGE_SIZE, type ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { INVENTORY_CONFLICTS, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import {
  classifyFinance,
  SCORE_POINTS,
  TO_RECONCILE,
  type BankTransactionListItem,
  type PaymentListItem,
} from './finance.model';

/** The queue opens on what is still to reconcile, oldest first: the status is a pill the reader removes to read the rest. */
export function queueFilter(): FilterGroup {
  return {
    join: 'and',
    rules: [
      {
        field: 'status',
        filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: [...TO_RECONCILE] }] },
      },
    ],
  };
}

export function queueQuery(size = LIST_PAGE_SIZE): GridQuery {
  return {
    ...emptyQuery({ index: 0, size }),
    filter: queueFilter(),
    sort: [{ column: 'postedDate', direction: 'ascending' }],
  };
}

/**
 * The bank transactions (§66.13), the workspace's queue. The amount is
 * filtered in US dollars and travels in cents, as `bankTransactionResource`
 * compares it; the confidence is scored on read, page by page.
 */
@Injectable({ providedIn: 'root' })
export class BankTransactionsStore extends ListStore<BankTransactionListItem> {
  protected readonly scales: ScaleMap = { amount: 100 };
  protected readonly failureMessage = 'The bank transactions could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<BankTransactionListItem>> {
    return api.finance.bankTransactions.list(query);
  }
}

/** One criterion of §66.13's score, with what it added to this candidate. */
export interface ScoreLine {
  readonly key: 'amount' | 'reference' | 'customer' | 'number' | 'date';
  readonly label: string;
  readonly earned: number;
  /** What the criterion can add at most. */
  readonly points: number;
}

export interface ScoreExplanation {
  readonly lines: readonly ScoreLine[];
  /** The criteria added up, before the cap. */
  readonly sum: number;
  /** §66.13 caps the score at 100. */
  readonly score: number;
  readonly capped: boolean;
  readonly confidence: 'high' | 'medium' | 'low';
}

/** §66.13's bands: high from 85, medium from 60, low below. */
export function confidenceOf(score: number): 'high' | 'medium' | 'low' {
  return score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low';
}

/** The three bands in one sentence, said beside the band's own mark (CP-06: the mark carries the word). */
export const BAND_WORDS = 'High from 85, medium from 60 to 84, low under 60';

/**
 * A candidate's score taken apart criterion by criterion, from the reasons
 * the backend gave it and the points §66.13 gives each (`SCORE_POINTS`). The
 * five lines are always drawn, so a reader sees what did not score as well as
 * what did; the date is one criterion worth 10 within two days and 5 within
 * seven.
 */
export function explainScore(candidate: Pick<BankMatchCandidate, 'reasons'>): ScoreExplanation {
  const has = (reason: string) => candidate.reasons.includes(reason);
  const points = (reason: string) => SCORE_POINTS[reason] ?? 0;
  const within2 = has('Posted within 2 days');
  const within7 = has('Posted within 7 days');
  const lines: ScoreLine[] = [
    {
      key: 'amount',
      label: 'Same amount to the cent',
      earned: has('Exact amount match') ? points('Exact amount match') : 0,
      points: points('Exact amount match'),
    },
    {
      key: 'reference',
      label: 'Bank reference is the document’s reference',
      earned: has('Bank reference matches') ? points('Bank reference matches') : 0,
      points: points('Bank reference matches'),
    },
    {
      key: 'number',
      label: 'Description carries the document number',
      earned: has('Description contains document number') ? points('Description contains document number') : 0,
      points: points('Description contains document number'),
    },
    {
      key: 'customer',
      label: 'Description names the customer',
      earned: has('Description contains customer name') ? points('Description contains customer name') : 0,
      points: points('Description contains customer name'),
    },
    {
      key: 'date',
      label: within2
        ? 'Posted within 2 days of the document’s date'
        : within7
          ? 'Posted within 7 days of the document’s date'
          : 'Posted more than 7 days from the document’s date',
      earned: within2 ? points('Posted within 2 days') : within7 ? points('Posted within 7 days') : 0,
      points: points('Posted within 2 days'),
    },
  ];
  const sum = lines.reduce((total, line) => total + line.earned, 0);
  const score = Math.min(100, sum);
  return { lines, sum, score, capped: sum > 100, confidence: confidenceOf(score) };
}

/** A candidate with the document it names read beside it. */
export interface CandidateView {
  readonly key: string;
  readonly kind: 'payment' | 'invoice';
  readonly candidate: BankMatchCandidate;
  readonly documentId: string;
  readonly number: string;
  readonly customerId: string;
  readonly customerName: string;
  /** The payment's amount, or what the invoice still owes. */
  readonly amount: Money;
  /** The payment's received date, or the invoice's due date. */
  readonly date: string;
  readonly reference?: string;
  /** The deposit less the candidate's amount, in the deposit's currency. */
  readonly difference: number;
  readonly explanation: ScoreExplanation;
  /**
   * A payment is linked only at the exact amount and currency (`match` refuses
   * the rest); an invoice is always a place to create and allocate a payment.
   */
  readonly confirmable: boolean;
}

/** What confirming a deposit against an invoice writes, stated before the confirm (FM-14). */
export interface InvoiceMatchPreview {
  readonly allocated: Money;
  readonly owesAfter: Money;
  readonly unapplied: Money;
}

export function invoiceMatchPreview(
  deposit: Money,
  invoice: Pick<InvoiceListItem, 'outstanding'>,
): InvoiceMatchPreview {
  const allocated = Math.min(invoice.outstanding.minor, deposit.minor);
  return {
    allocated: { currency: deposit.currency, minor: allocated },
    owesAfter: { currency: invoice.outstanding.currency, minor: invoice.outstanding.minor - allocated },
    unapplied: { currency: deposit.currency, minor: deposit.minor - allocated },
  };
}

/** What a confirmed match wrote, read back from the payment it made or linked. */
export interface MatchOutcome {
  readonly paymentId: string;
  readonly paymentNumber: string;
  readonly created: boolean;
  readonly invoiceNumbers: readonly string[];
  readonly allocated: Money;
  readonly unapplied: Money;
}

export type ReconciliationBusy = `payment:${string}` | `invoice:${string}` | `customer:${string}` | 'ignore';

interface Region<T> {
  readonly value: T | null;
  readonly pending: boolean;
  readonly failed: boolean;
}

/**
 * The transaction the workspace has open (§13, §66.13): its candidates, each
 * with the document it names and its score taken apart, the open invoices of
 * the customer a candidate names, and the two commands — confirm and ignore.
 * Every command carries the version the page read, held as a number (ER-03);
 * a refusal is classed (ER-01) and a conflict reads the transaction again
 * (ER-02).
 */
@Injectable({ providedIn: 'root' })
export class ReconciliationStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly queue = inject(BankTransactionsStore);

  readonly id = signal<string | null>(null);
  readonly transaction = signal<BankTransactionListItem | null>(null);
  readonly candidates = signal<readonly CandidateView[]>([]);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<ReconciliationBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);
  readonly outcome = signal<MatchOutcome | null>(null);
  /** The customer whose open invoices stand at the workspace's right. */
  readonly customerId = signal<string | null>(null);
  readonly invoices = signal<Region<readonly InvoiceListItem[]>>({ value: null, pending: false, failed: false });

  private sequence = 0;
  private invoiceTicket = 0;
  private version = 0;

  readonly canManage = computed(() => {
    void this.session.session();
    return this.session.can('reconciliation.manage');
  });

  /** A transaction still to reconcile: matched and ignored ones are read, never changed. */
  readonly open = computed(() => {
    const status = this.transaction()?.status;
    return status !== undefined && status !== 'matched' && status !== 'ignored';
  });

  /** Every customer a candidate names, once, in the candidates' order. */
  readonly customers = computed(() => {
    const seen = new Map<string, string>();
    for (const view of this.candidates()) if (!seen.has(view.customerId)) seen.set(view.customerId, view.customerName);
    return [...seen].map(([id, name]) => ({ id, name }));
  });

  readonly customerName = computed(
    () => this.customers().find((customer) => customer.id === this.customerId())?.name ?? null,
  );

  /** No candidate is a payment to link: the deposit can still be recorded as a payment of a named customer. */
  readonly noPayment = computed(() => !this.candidates().some((view) => view.kind === 'payment'));

  async select(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.transaction.set(null);
      this.candidates.set([]);
      this.customerId.set(null);
      this.invoices.set({ value: null, pending: false, failed: false });
      this.error.set(null);
      this.failure.set(null);
      this.outcome.set(null);
    }
    await this.load();
  }

  clear(): void {
    this.sequence++;
    this.id.set(null);
    this.transaction.set(null);
    this.candidates.set([]);
    this.customerId.set(null);
    this.error.set(null);
    this.failure.set(null);
    this.outcome.set(null);
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const transaction = await api.finance.bankTransactions.get(id);
      if (ticket !== this.sequence) return;
      // The candidates land with the documents they name, so a row is never drawn without its amount.
      const candidates = await this.readCandidates(api, transaction);
      if (ticket !== this.sequence) return;
      this.version = transaction.metadata.version;
      this.transaction.set(transaction);
      this.candidates.set(candidates);
      const customer = this.customerId();
      const next =
        customer !== null && candidates.some((view) => view.customerId === customer)
          ? customer
          : (candidates[0]?.customerId ?? null);
      this.customerId.set(next);
      void this.loadInvoices();
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The bank transaction could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  chooseCustomer(id: string): void {
    if (this.customerId() === id) return;
    this.customerId.set(id);
    void this.loadInvoices();
  }

  /** The chosen customer's open invoices that owe, in the deposit's currency, soonest due first. */
  async loadInvoices(): Promise<void> {
    const customerId = this.customerId();
    const transaction = this.transaction();
    const ticket = ++this.invoiceTicket;
    if (customerId === null || transaction === null) {
      this.invoices.set({ value: [], pending: false, failed: false });
      return;
    }
    this.invoices.update((region) => ({ ...region, pending: true, failed: false }));
    try {
      const api = await this.backend.ready();
      const answer = await api.finance.invoices.list({
        pageSize: 25,
        sort: 'dueDate',
        filter: {
          customerId,
          lifecycle: 'open',
          currency: transaction.amount.currency,
          outstanding: { gt: 0 },
        },
      });
      if (ticket !== this.invoiceTicket) return;
      this.invoices.set({ value: answer.data, pending: false, failed: false });
    } catch (error) {
      if (ticket !== this.invoiceTicket) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.invoices.update((region) => ({ ...region, pending: false, failed: true }));
    }
  }

  matchPayment(paymentId: string): Promise<boolean> {
    return this.run(`payment:${paymentId}`, (api, id, version) =>
      api.finance.bankTransactions.match(id, { paymentId }, { ifMatch: version }),
    );
  }

  /** Creates a payment from the deposit and allocates it to the invoice (§66.13). */
  matchInvoice(invoiceId: string): Promise<boolean> {
    return this.run(`invoice:${invoiceId}`, (api, id, version) =>
      api.finance.bankTransactions.match(id, { invoiceId, allocate: true }, { ifMatch: version }),
    );
  }

  /** Records the deposit as a payment of the customer, left unapplied. */
  createForCustomer(customerId: string): Promise<boolean> {
    return this.run(`customer:${customerId}`, (api, id, version) =>
      api.finance.bankTransactions.match(id, { customerId }, { ifMatch: version }),
    );
  }

  ignore(reason: string): Promise<boolean> {
    return this.run('ignore', (api, id, version) =>
      api.finance.bankTransactions.ignore(id, { reason }, { ifMatch: version }),
    );
  }

  private async run(
    kind: ReconciliationBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<BankTransactionListItem>,
  ): Promise<boolean> {
    const id = this.id();
    if (id === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    this.outcome.set(null);
    try {
      const api = await this.backend.ready();
      const matched = await this.health.mutation(() => action(api, id, this.version));
      if (matched.matchedPaymentId) {
        const payment = await this.health.read(() => api.finance.payments.get(matched.matchedPaymentId!), null);
        if (payment) this.outcome.set(outcomeOf(payment.payment, !kind.startsWith('payment:')));
      }
      await this.load();
      if (this.queue.total() !== null) void this.queue.reload();
      return true;
    } catch (error) {
      this.failure.set(classifyFinance(error, 'The bank transaction was not changed.'));
      if (isApiError(error) && (INVENTORY_CONFLICTS.has(error.code) || error.code === 'INVALID_STATE_TRANSITION')) {
        await this.load();
        if (this.queue.total() !== null) void this.queue.reload();
      }
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  private async readCandidates(
    api: NexoraApi,
    transaction: BankTransactionListItem,
  ): Promise<readonly CandidateView[]> {
    const open = transaction.status !== 'matched' && transaction.status !== 'ignored';
    if (!open) return [];
    const views = await Promise.all(
      transaction.candidates.map(async (candidate): Promise<CandidateView | null> => {
        const explanation = explainScore(candidate);
        if (candidate.paymentId) {
          const detail = await this.health.read(() => api.finance.payments.get(candidate.paymentId!), null);
          if (!detail) return null;
          const payment = detail.payment;
          const difference = transaction.amount.minor - payment.amount.minor;
          return {
            key: `payment:${payment.id}`,
            kind: 'payment',
            candidate,
            documentId: payment.id,
            number: payment.paymentNumber,
            customerId: payment.customerId,
            customerName: payment.customerName,
            amount: payment.amount,
            date: payment.receivedDate,
            ...(payment.reference ? { reference: payment.reference } : {}),
            difference,
            explanation,
            confirmable:
              difference === 0 &&
              payment.amount.currency === transaction.amount.currency &&
              payment.status === 'posted' &&
              !payment.sourceBankTransactionId,
          };
        }
        if (candidate.invoiceId) {
          const detail = await this.health.read(() => api.finance.invoices.get(candidate.invoiceId!), null);
          if (!detail) return null;
          const invoice = detail.invoice;
          return {
            key: `invoice:${invoice.id}`,
            kind: 'invoice',
            candidate,
            documentId: invoice.id,
            number: invoice.invoiceNumber ?? invoice.id,
            customerId: invoice.customerId,
            customerName: invoice.customerName,
            amount: invoice.outstanding,
            date: invoice.dueDate,
            ...(invoice.customerPoNumber ? { reference: invoice.customerPoNumber } : {}),
            difference: transaction.amount.minor - invoice.outstanding.minor,
            explanation,
            confirmable: invoice.lifecycle === 'open' && invoice.outstanding.minor > 0,
          };
        }
        return null;
      }),
    );
    return views.filter((view): view is CandidateView => view !== null);
  }
}

function outcomeOf(payment: PaymentListItem, created: boolean): MatchOutcome {
  return {
    paymentId: payment.id,
    paymentNumber: payment.paymentNumber,
    created,
    invoiceNumbers: payment.invoiceNumbers,
    allocated: payment.allocatedAmount,
    unapplied: payment.unappliedAmount,
  };
}
