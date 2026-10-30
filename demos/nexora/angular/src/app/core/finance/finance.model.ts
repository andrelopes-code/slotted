import {
  usdMinor,
  writeOffAuthority,
  type BankTransactionStatus,
  type CreditMemoLifecycle,
  type CreditMemoReason,
  type InvoiceListItem,
  type Money,
  type NexoraApi,
  type PaymentMethod,
  type PaymentStatus,
} from '@slotted/demo-nexora-backend';

import { formatMoney } from '../catalog/catalog.model';
import { classify, type FailureKind, type InventoryFailure } from '../inventory/inventory-failure';

export const FINANCE_ROUTE = '/finance';
export const FINANCE_OVERVIEW_ROUTE = '/finance/overview';
export const INVOICES_ROUTE = '/finance/invoices';
export const PAYMENTS_ROUTE = '/finance/payments';
/** The payment form, on its own route under the list it returns to (FM-01). */
export const NEW_PAYMENT_ROUTE = '/finance/payments/new';
export const RECONCILIATION_ROUTE = '/finance/reconciliation';
/**
 * Credit memos have no destination in the navigation (Appendix A): they change
 * what invoices owe, so they live under Invoices, declared before its `:id`.
 */
export const CREDIT_MEMOS_ROUTE = '/finance/invoices/credit-memos';
export const NEW_CREDIT_MEMO_ROUTE = '/finance/invoices/credit-memos/new';

export type InvoiceDetail = Awaited<ReturnType<NexoraApi['finance']['invoices']['get']>>;
export type PaymentDetail = Awaited<ReturnType<NexoraApi['finance']['payments']['get']>>;
export type PaymentListItem = PaymentDetail['payment'];
export type CreditMemoDetail = Awaited<ReturnType<NexoraApi['finance']['creditMemos']['get']>>;
export type CreditMemoListItem = CreditMemoDetail['creditMemo'];
export type RefundListItem = Awaited<ReturnType<NexoraApi['finance']['refunds']['list']>>[number];
export type BankTransactionListItem = Awaited<
  ReturnType<NexoraApi['finance']['bankTransactions']['get']>
>;
export type FinanceOverview = Awaited<ReturnType<NexoraApi['finance']['overview']>>;

/** §66.2: the composite label the list computes from the three axes. */
export const INVOICE_STATUS_LABEL: Record<InvoiceListItem['displayStatus'], string> = {
  Draft: 'Draft',
  Open: 'Open',
  'Partially Paid': 'Partly paid',
  Paid: 'Paid',
  Overdue: 'Overdue',
  Disputed: 'Disputed',
  Voided: 'Voided',
  'Written Off': 'Written off',
};

export const INVOICE_STATUS_TONE: Record<
  InvoiceListItem['displayStatus'],
  'secondary' | 'accent' | 'warning' | 'success' | 'danger'
> = {
  Draft: 'secondary',
  Open: 'accent',
  'Partially Paid': 'accent',
  Paid: 'success',
  Overdue: 'danger',
  Disputed: 'warning',
  Voided: 'secondary',
  'Written Off': 'secondary',
};

/** §66.2's three axes, each in its own words. */
export const LIFECYCLE_LABEL: Record<InvoiceListItem['lifecycle'], string> = {
  draft: 'Draft',
  open: 'Open',
  voided: 'Voided',
  written_off: 'Written off',
};
export const SETTLEMENT_LABEL: Record<InvoiceListItem['settlement'], string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partly paid',
  paid: 'Paid',
};
export const COLLECTION_LABEL: Record<InvoiceListItem['collectionState'], string> = {
  current: 'Current',
  overdue: 'Overdue',
  disputed: 'Disputed',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  ach: 'ACH',
  wire: 'Wire transfer',
  credit_card: 'Credit card',
  check: 'Check',
  pix: 'Pix',
  boleto: 'Boleto',
  other: 'Other',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  posted: 'Posted',
  failed: 'Failed',
  reversed: 'Reversed',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'secondary' | 'success' | 'danger' | 'warning'> = {
  pending: 'warning',
  posted: 'success',
  failed: 'danger',
  reversed: 'secondary',
};

export const BANK_STATUS_LABEL: Record<BankTransactionStatus, string> = {
  unmatched: 'Unmatched',
  suggested: 'Suggested',
  matched: 'Matched',
  needs_review: 'Needs review',
  ignored: 'Ignored',
};

export const BANK_STATUS_TONE: Record<
  BankTransactionStatus,
  'secondary' | 'accent' | 'success' | 'warning'
> = {
  unmatched: 'secondary',
  suggested: 'accent',
  matched: 'success',
  needs_review: 'warning',
  ignored: 'secondary',
};

/** The states a transaction is still to reconcile in (§13). */
export const TO_RECONCILE: readonly BankTransactionStatus[] = ['unmatched', 'suggested', 'needs_review'];

/** §66.13: high from 85, medium from 60, low below. */
export const CONFIDENCE_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
export const CONFIDENCE_TONE: Record<'high' | 'medium' | 'low', 'success' | 'warning' | 'secondary'> = {
  high: 'success',
  medium: 'warning',
  low: 'secondary',
};

/** §66.13's score, each criterion with the points it adds, in the words the backend gives the reason. */
export const SCORE_POINTS: Record<string, number> = {
  'Exact amount match': 60,
  'Bank reference matches': 25,
  'Description contains customer name': 10,
  'Description contains document number': 15,
  'Posted within 2 days': 10,
  'Posted within 7 days': 5,
};

export const CREDIT_MEMO_REASON_LABEL: Record<CreditMemoReason, string> = {
  return: 'Return',
  pricing_correction: 'Pricing correction',
  service_recovery: 'Service recovery',
  manual_adjustment: 'Manual adjustment',
};

export const CREDIT_MEMO_LIFECYCLE_LABEL: Record<CreditMemoLifecycle, string> = {
  draft: 'Draft',
  open: 'Open',
  fully_applied: 'Fully applied',
  voided: 'Voided',
};

export const CREDIT_MEMO_LIFECYCLE_TONE: Record<
  CreditMemoLifecycle,
  'secondary' | 'accent' | 'success'
> = {
  draft: 'secondary',
  open: 'accent',
  fully_applied: 'success',
  voided: 'secondary',
};

/** §66.5: the write-off thresholds, stated in US dollars whatever the invoice is written in. */
export const ACCOUNTANT_WRITE_OFF_USD = 500;
export const APPROVAL_WRITE_OFF_USD = 5_000;

export type WriteOffAuthority = ReturnType<typeof writeOffAuthority>;

export interface WriteOffRule {
  /** Who §66.5 gives the write-off of this balance to. */
  readonly authority: WriteOffAuthority;
  /** The balance the threshold is measured in, US dollars in minor units. */
  readonly outstandingUsdMinor: number;
  /** The reader may send the command: a write-off, or a request for one. */
  readonly allowed: boolean;
  /** The command asks for an approval rather than writing the balance off. */
  readonly asksApproval: boolean;
  /** One sentence naming the authority the balance needs, said before any control (FM-11, FM-13). */
  readonly words: string;
}

/** A US-dollar figure beside a document's own currency says which dollar it is: "US$151,891.76". */
const usd = (minor: number): string =>
  `US$${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * What §66.5 asks of a write-off of this invoice's whole balance, computed the
 * way the command does: the outstanding in US dollars at the invoice's rate,
 * against US$500 and US$5,000. `financeManager` is what the backend reads as
 * one: the Finance Manager role, or the administrator's.
 */
export function writeOffRule(
  invoice: Pick<InvoiceListItem, 'outstanding' | 'fxRateToUsd' | 'currency'>,
  canWriteOff: boolean,
  financeManager: boolean,
): WriteOffRule {
  const outstandingUsdMinor = usdMinor(invoice.outstanding, invoice.fxRateToUsd);
  const authority = writeOffAuthority(outstandingUsdMinor);
  const inUsd = invoice.currency === 'USD' ? '' : ` (${usd(outstandingUsdMinor)})`;
  const balance = `${formatMoney(invoice.outstanding)}${inUsd}`;
  switch (authority) {
    case 'accountant':
      return {
        authority,
        outstandingUsdMinor,
        allowed: canWriteOff,
        asksApproval: false,
        words: `The balance, ${balance}, is within the US$${ACCOUNTANT_WRITE_OFF_USD} an accountant may write off.`,
      };
    case 'finance_manager':
      return {
        authority,
        outstandingUsdMinor,
        allowed: canWriteOff && financeManager,
        asksApproval: false,
        words: `The balance, ${balance}, is above US$${ACCOUNTANT_WRITE_OFF_USD}: only a Finance Manager writes it off.`,
      };
    default:
      return {
        authority,
        outstandingUsdMinor,
        allowed: canWriteOff && financeManager,
        asksApproval: true,
        words: `The balance, ${balance}, is above US$${APPROVAL_WRITE_OFF_USD.toLocaleString('en-US')}: a Finance Manager asks for it, with a reason, and another Finance Manager approves it before it is written off.`,
      };
  }
}

/** The backend's roles that it reads as a Finance Manager's authority (`invoices.writeOff`). */
export function isFinanceManager(roles: readonly { name: string }[]): boolean {
  return roles.some((role) => role.name === 'Finance Manager' || role.name === 'Administrator');
}

/** What a refusal of a finance command means, in the module's words (ER-01). */
export const FINANCE_WORDS: Record<string, string> = {
  STALE_VERSION: 'Someone else changed this record while the page was open.',
  INVALID_STATE_TRANSITION: 'The record is no longer in a state that allows this.',
  INVOICE_HAS_ALLOCATIONS:
    'A payment or a credit is applied to this invoice, so it cannot be voided. Reverse the payment or write the balance off instead.',
  WRITE_OFF_LIMIT_EXCEEDED: 'This balance is above what your role may write off.',
  APPROVAL_REQUIRED: 'A write-off approval for this invoice is still waiting on a Finance Manager.',
  INVOICE_ALREADY_PAID: 'This invoice has nothing outstanding.',
  ALLOCATION_EXCEEDS_OUTSTANDING: 'An allocation is larger than what the invoice still owes.',
  ALLOCATION_EXCEEDS_PAYMENT: 'The allocations add up to more than the payment.',
  CURRENCY_MISMATCH: 'The payment and the invoice are written in different currencies.',
  PAYMENT_NOT_POSTED: 'Only a posted payment can be allocated or refunded.',
  CREDIT_EXCEEDED: 'The amount is larger than the credit available or the balance it is applied to.',
  OVER_INVOICING: 'Everything shipped on this order is already invoiced.',
  APPROVAL_ALREADY_DECIDED: 'Another approver decided this one a moment ago.',
  FORBIDDEN: 'Your role does not hold this command.',
};

/** A refusal classed by what the reader does next; a write-off above the reader's authority is a permission (ER-01). */
export function classifyFinance(error: unknown, fallback: string): InventoryFailure {
  const failure = classify(error, FINANCE_WORDS, fallback);
  return failure.code === 'WRITE_OFF_LIMIT_EXCEEDED' ? { ...failure, kind: 'permission' } : failure;
}

/** What the reader does next about the class of refusal they met (ER-04). */
export function financeAdvice(kind: FailureKind): string {
  switch (kind) {
    case 'conflict':
      return 'The page has been read again: what you see below is what Nexora holds now.';
    case 'transport':
      return 'Nothing was changed. Try the same action again in a moment.';
    case 'permission':
      return 'Your role does not hold this command; the sentence under the record says who does.';
    case 'validation':
      return 'Correct the fields marked below and try again.';
    default:
      return 'Nothing was changed.';
  }
}

/**
 * Who holds a finance command or read, in the words PM-02 and RP-09 name them:
 * the roles `ROLE_DEFINITIONS` grants it to.
 */
export const FINANCE_HOLDERS: Record<string, string> = {
  'finance.dashboard': 'a finance manager, an accountant, an executive, an auditor or an administrator',
  'invoices.view':
    'every role but the buyer and the warehouse roles: sales, support, finance, an executive, an auditor or an administrator',
  'payments.view':
    'a sales manager, a finance manager, an accountant, an executive, an auditor or an administrator',
  'credit_memos.view':
    'a sales manager, a finance manager, an accountant, an executive, an auditor or an administrator',
  'reconciliation.view': 'a finance manager, an accountant, an executive, an auditor or an administrator',
  'invoices.create': 'a finance manager, an accountant or an administrator',
  'invoices.edit_draft': 'a finance manager, an accountant or an administrator',
  'invoices.open': 'a finance manager, an accountant or an administrator',
  'invoices.send': 'a finance manager, an accountant or an administrator',
  'invoices.void': 'a finance manager, an accountant or an administrator',
  'invoices.write_off': 'a finance manager, an accountant or an administrator',
  'payments.record': 'a finance manager, an accountant or an administrator',
  'payments.reverse': 'a finance manager, an accountant or an administrator',
  'credit_memos.create': 'a finance manager, an accountant or an administrator',
  'credit_memos.open': 'a finance manager, an accountant or an administrator',
  'refunds.create': 'a finance manager, an accountant or an administrator',
  'reconciliation.manage': 'a finance manager, an accountant or an administrator',
  'customers.credit_view':
    'a sales manager, the account’s own representative, a finance manager, an accountant, an executive, an auditor or an administrator',
  'notes.create':
    'a sales manager, the account’s own representative, a finance manager, a support manager or agent, or an administrator',
};

/** Whole days between two business dates, `later` less `earlier`. */
export function daysBetween(later: string, earlier: string): number {
  const at = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  return Math.round((at(later) - at(earlier)) / 86_400_000);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Where an invoice stands against its due date, by §66.6's rule: overdue is
 * open, owing and past due, and a dispute changes the collection state without
 * pausing the aging (§66.5).
 */
export function agingWords(
  invoice: Pick<InvoiceListItem, 'lifecycle' | 'outstanding' | 'dueDate' | 'collectionState'>,
  today: string,
): string {
  if (invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0) return '';
  const past = daysBetween(today, invoice.dueDate);
  const aging =
    past > 0 ? `${plural(past, 'day')} past due` : past === 0 ? 'Due today' : `Due in ${plural(-past, 'day')}`;
  return invoice.collectionState === 'disputed' && past > 0 ? `${aging}, disputed` : aging;
}

/** §72.6's buckets as the overview draws them. */
export const AGING_LABEL: Record<FinanceOverview['aging'][number]['bucket'], string> = {
  current: 'Not yet due',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': 'Over 90 days',
};

export function money(value: Money): string {
  return formatMoney(value);
}

/** A business date `days` after another. */
export function addDaysTo(iso: string, days: number): string {
  const at = new Date(`${iso}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/**
 * The doors the overview opens into the invoice list (OV-01): each a query
 * parameter the list reads into its bar's own pills, so the door is a link a
 * colleague can paste. `invoiceResource`'s field names are the pills' keys.
 *
 * - `owing=1` — open and owing, as `receivables` and `openInvoiceCount` count (§72.6);
 * - `collection=overdue|disputed` — §66.2's collection state;
 * - `due=soon` — open and due from today to five days out, as `invoicesDueWithin5Days` counts;
 * - `aging=current|1-30|31-60|61-90|90+` — open, owing, and that many days past due (§72.6).
 */
export type InvoiceDoor =
  | { readonly owing: '1' }
  | { readonly collection: 'overdue' | 'disputed' }
  | { readonly due: 'soon' }
  | { readonly aging: FinanceOverview['aging'][number]['bucket'] };

export function invoiceDoorParams(door: InvoiceDoor): Record<string, string> {
  return { ...door };
}

const setRule = (field: string, values: readonly string[]) => ({
  field,
  filter: { kind: 'set' as const, join: 'and' as const, conditions: [{ operator: 'anyOf' as const, value: [...values] }] },
});
const numberRule = (
  field: string,
  conditions: readonly { operator: 'greaterThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'between'; value: number; end?: number }[],
) => ({
  field,
  filter: { kind: 'number' as const, join: 'and' as const, conditions: conditions.map((condition) => ({ ...condition })) },
});

/**
 * The door's condition as the bar's pills, or null for an address that names
 * no door. The aging buckets read `daysOverdue`, which the list computes for
 * every open invoice that owes, the way the overview buckets them.
 */
export function invoiceDoorFilter(
  params: { get(name: string): string | null },
  today: string,
): import('@slotted/core/filter').FilterGroup | null {
  if (params.get('owing') === '1')
    return {
      join: 'and',
      rules: [setRule('lifecycle', ['open']), numberRule('outstanding', [{ operator: 'greaterThan', value: 0 }])],
    };
  const collection = params.get('collection');
  if (collection === 'overdue' || collection === 'disputed')
    return { join: 'and', rules: [setRule('collectionState', [collection])] };
  if (params.get('due') === 'soon')
    return {
      join: 'and',
      rules: [
        setRule('lifecycle', ['open']),
        numberRule('outstanding', [{ operator: 'greaterThan', value: 0 }]),
        {
          field: 'dueDate',
          filter: {
            kind: 'date',
            join: 'and',
            conditions: [{ operator: 'between', value: today, end: addDaysTo(today, 5) }],
          },
        },
      ],
    };
  const aging = params.get('aging');
  const bounds: Record<string, [number, number | null]> = {
    current: [0, 0],
    '1-30': [1, 30],
    '31-60': [31, 60],
    '61-90': [61, 90],
    '90+': [91, null],
  };
  const range = aging ? bounds[aging] : undefined;
  if (range) {
    const [low, high] = range;
    return {
      join: 'and',
      rules: [
        setRule('lifecycle', ['open']),
        numberRule('outstanding', [{ operator: 'greaterThan', value: 0 }]),
        numberRule(
          'daysOverdue',
          high === null
            ? [{ operator: 'greaterThanOrEqual', value: low }]
            : low === high
              ? [{ operator: 'lessThanOrEqual', value: high }]
              : [{ operator: 'between', value: low, end: high }],
        ),
      ],
    };
  }
  return null;
}
