import type {
  AddressSnapshot,
  CurrencyCode,
  EntityMetadata,
  Money,
  PaymentTermsCode,
  Quantity,
} from './common';

export type InvoiceLifecycle = 'draft' | 'open' | 'voided' | 'written_off';
export type InvoiceSettlement = 'unpaid' | 'partially_paid' | 'paid';
export type InvoiceCollectionState = 'current' | 'overdue' | 'disputed';

export interface Invoice {
  id: string;
  organizationId: string;
  /** Assigned when the invoice is opened. */
  invoiceNumber?: string;
  customerId: string;
  sourceOrderId?: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  fxRateToUsd?: string;
  lifecycle: InvoiceLifecycle;
  collectionState: InvoiceCollectionState;
  /** projection */
  settlement: InvoiceSettlement;
  /** projection */
  paidAmount: Money;
  /** projection */
  outstanding: Money;
  billingContactId?: string;
  billingAddress: AddressSnapshot;
  customerPoNumber?: string;
  paymentTermsCode: PaymentTermsCode;
  subtotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  costTotal: Money;
  writtenOffAmount: Money;
  sentAt?: string;
  openedAt?: string;
  voidedAt?: string;
  writtenOffAt?: string;
  disputeReason?: string;
  metadata: EntityMetadata;
}

export interface InvoiceLine {
  id: string;
  organizationId: string;
  invoiceId: string;
  lineNumber: number;
  orderLineId?: string;
  shipmentLineId?: string;
  skuId?: string;
  description: string;
  quantity: Quantity;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
  unitCostSnapshot?: Money;
}

/** `pix` and `boleto` are the Brazil region's local methods. */
export type PaymentMethod = 'ach' | 'wire' | 'credit_card' | 'check' | 'pix' | 'boleto' | 'other';
export type PaymentStatus = 'pending' | 'posted' | 'failed' | 'reversed';

export interface Payment {
  id: string;
  organizationId: string;
  paymentNumber: string;
  customerId: string;
  amount: Money;
  fxRateToUsd?: string;
  method: PaymentMethod;
  receivedDate: string;
  reference?: string;
  status: PaymentStatus;
  recordedBy: string;
  /** projection */
  unappliedAmount: Money;
  reversedAt?: string;
  reversalReason?: string;
  sourceBankTransactionId?: string;
  metadata: EntityMetadata;
}

export interface PaymentAllocation {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string;
  amount: Money;
  status: 'active' | 'reversed';
  createdAt: string;
  reversedAt?: string;
}

export type CreditMemoReason =
  'return' | 'pricing_correction' | 'service_recovery' | 'manual_adjustment';
export type CreditMemoLifecycle = 'draft' | 'open' | 'fully_applied' | 'voided';

export interface CreditMemo {
  id: string;
  organizationId: string;
  creditMemoNumber: string;
  customerId: string;
  sourceReturnId?: string;
  sourceInvoiceId?: string;
  reason: CreditMemoReason;
  issueDate: string;
  currency: CurrencyCode;
  lifecycle: CreditMemoLifecycle;
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  /** projection */
  appliedAmount: Money;
  /** projection */
  unappliedAmount: Money;
  metadata: EntityMetadata;
}

export interface CreditMemoLine {
  id: string;
  organizationId: string;
  creditMemoId: string;
  invoiceLineId?: string;
  returnLineId?: string;
  description: string;
  quantity?: Quantity;
  amount: Money;
  taxAmount: Money;
}

export interface CreditMemoApplication {
  id: string;
  organizationId: string;
  creditMemoId: string;
  invoiceId: string;
  amount: Money;
  status: 'active' | 'reversed';
  createdAt: string;
  reversedAt?: string;
}

export interface Refund {
  id: string;
  organizationId: string;
  refundNumber: string;
  customerId: string;
  creditMemoId?: string;
  paymentId?: string;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  reason: string;
  postedAt?: string;
  metadata: EntityMetadata;
}

export type BankTransactionStatus =
  'unmatched' | 'suggested' | 'matched' | 'needs_review' | 'ignored';

export interface BankMatchCandidate {
  paymentId?: string;
  invoiceId?: string;
  customerId: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface BankTransaction {
  id: string;
  organizationId: string;
  postedDate: string;
  description: string;
  reference?: string;
  /** positive = incoming cash */
  amount: Money;
  status: BankTransactionStatus;
  matchedPaymentId?: string;
  /** projection */
  candidates: BankMatchCandidate[];
  ignoreReason?: string;
  metadata: EntityMetadata;
}

export interface FinanceOverview {
  asOf: string;
  receivables: Money;
  overdueReceivables: Money;
  unappliedCredit: Money;
  invoicedRevenueTrailing30Days: Money;
  invoicedRevenueTrailing90Days: Money;
  /**
   * Section 72.7; null when undefined. `no-revenue`: nothing was invoiced in
   * the trailing 90 days; `not-kept`: invoices are not kept for all of them
   * (section 75.4), so the base would be a part of the 90 days.
   */
  dsoDays: number | null;
  dsoUndefined?: 'no-revenue' | 'not-kept';
  /** First business date from which every invoice and payment is kept (section 75.4). */
  keptFrom: string;
  openInvoiceCount: number;
  overdueInvoiceCount: number;
  disputedInvoiceCount: number;
  /** Outstanding of the disputed open invoices, in USD (section 13, "disputed balance"). */
  disputedReceivables: Money;
  /** Posted payments received from the first of the demo month to today, in USD. */
  cashCollectedMonthToDate: Money;
  paymentsReceivedMonthToDate: number;
  /** The payment trend (section 13): eight seven-day weeks ending today, oldest first, in USD. */
  cashCollectedByWeek: { weekStart: string; amount: Money; count: number; kept: boolean }[];
  invoicesDueWithin5Days: number;
  unmatchedBankTransactions: number;
  pendingApprovals: number;
  aging: { bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+'; amount: Money; count: number }[];
  topOverdueCustomers: { customerId: string; displayName: string; overdue: Money }[];
}
