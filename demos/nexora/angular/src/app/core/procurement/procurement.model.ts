import {
  evaluatePurchaseOrderApproval,
  usdMinor,
  type ApprovalEvaluation,
  type CurrencyCode,
  type NexoraApi,
  type PaymentTermsCode,
  type PurchaseOrderExceptionFlag,
  type PurchaseOrderStatus,
  type SupplierStatus,
  type SupplierTier,
} from '@slotted/demo-nexora-backend';

export const PROCUREMENT_ROUTE = '/procurement';
export const SUPPLIERS_ROUTE = '/procurement/suppliers';
export const PURCHASE_ORDERS_ROUTE = '/procurement/purchase-orders';
/** The receiving queue; its `:id` is one goods receipt, which has no list of its own. */
export const RECEIVING_ROUTE = '/procurement/receiving';

/** One goods receipt as `GET /goods-receipts/:id` answers it. */
export type GoodsReceiptDetail = Awaited<ReturnType<NexoraApi['purchaseOrders']['receipt']>>;

export const PO_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  pending_approval: 'In approval',
  approved: 'Approved',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  partially_received: 'Partly received',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const PO_STATUS_TONE: Record<
  PurchaseOrderStatus,
  'secondary' | 'accent' | 'warning' | 'success'
> = {
  draft: 'secondary',
  pending_approval: 'warning',
  approved: 'accent',
  sent: 'accent',
  acknowledged: 'accent',
  partially_received: 'warning',
  received: 'success',
  closed: 'secondary',
  cancelled: 'secondary',
};

/** §65.3: exception flags stand beside the status, never in its place. */
export const PO_EXCEPTION_LABEL: Record<PurchaseOrderExceptionFlag, string> = {
  delayed: 'Delayed',
  disputed: 'Disputed',
};

/** §65.7: the three states a goods receipt can be written against. */
export const RECEIVABLE: readonly PurchaseOrderStatus[] = [
  'sent',
  'acknowledged',
  'partially_received',
];

/** What `suppliers.update` counts as open when it refuses an inactivation (`SUPPLIER_HAS_OPEN_POS`). */
export const BLOCKS_INACTIVATION: readonly PurchaseOrderStatus[] = [
  'pending_approval',
  'approved',
  ...RECEIVABLE,
];

export const SUPPLIER_STATUS_LABEL: Record<SupplierStatus, string> = {
  active: 'Active',
  on_hold: 'On hold',
  inactive: 'Inactive',
};

export const SUPPLIER_STATUS_TONE: Record<SupplierStatus, 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  on_hold: 'warning',
  inactive: 'secondary',
};

/** §65.1: the relationship tier is independent of the lifecycle status. */
export const SUPPLIER_TIER_LABEL: Record<SupplierTier, string> = {
  standard: 'Standard',
  preferred: 'Preferred',
  conditional: 'Conditional',
};

export const SUPPLIER_TIER_TONE: Record<SupplierTier, 'secondary' | 'accent' | 'warning'> = {
  standard: 'secondary',
  preferred: 'accent',
  conditional: 'warning',
};

export const PAYMENT_TERMS_LABEL: Record<PaymentTermsCode, string> = {
  DUE_ON_RECEIPT: 'Due on receipt',
  NET_15: 'Net 15',
  NET_30: 'Net 30',
  NET_45: 'Net 45',
  NET_60: 'Net 60',
};

/** §65.7: a line may be received up to 5% above what was ordered without an approver. */
export const OVER_RECEIPT_TOLERANCE = 1.05;
/** `receive` marks the order received once every line reaches 95% of what was ordered. */
export const RECEIVED_SHARE = 0.95;
/** §65.5: the approval thresholds, in US dollars. */
export const PROCUREMENT_APPROVAL_USD = 25_000;
export const FINANCE_APPROVAL_USD = 100_000;

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * A share the backend states in basis points, as a percent with the places
 * the basis points hold and none they do not: 9259 is "92.59%", 10000 is
 * "100%".
 */
export function percentFromBps(bps: number): string {
  return percent.format(bps / 10_000);
}

/** §65.7's quality score, 0 to 100, with the two places its basis points give it. */
export function formatScore(score: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(score);
}

export function formatDays(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/** A role key as the words an operator uses for it: `procurement_manager` is "Procurement Manager". */
export function roleWords(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface ApprovalInput {
  readonly subtotalMinor: number;
  readonly freightMinor: number;
  readonly currency: CurrencyCode;
  readonly fxRateToUsd?: string | undefined;
  readonly conditional: boolean;
  /** The largest unit-cost rise against the last accepted cost, in basis points; 0 where none is known. */
  readonly maxVarianceBps: number;
}

/**
 * What `submit` will ask for, computed by the policy the backend runs
 * (`purchase_order.v1`, §65.5) on the values the form holds: subtotal plus
 * freight in US dollars, the supplier's tier and the cost variance.
 */
export function previewApproval(input: ApprovalInput): ApprovalEvaluation & { valueUsdMinor: number } {
  const valueUsdMinor = usdMinor(
    { currency: input.currency, minor: input.subtotalMinor + input.freightMinor },
    input.fxRateToUsd,
  );
  return {
    ...evaluatePurchaseOrderApproval({
      approvalValueUsdMinor: valueUsdMinor,
      supplierConditional: input.conditional,
      maxCostVarianceBps: input.maxVarianceBps,
    }),
    valueUsdMinor,
  };
}

/** The steps an approval will take, as one sentence: "a Procurement Manager, then a Finance Manager". */
export function stepsWords(evaluation: ApprovalEvaluation): string {
  const roles = evaluation.steps.map((step) => `a ${roleWords(step.requiredRole)}`);
  return roles.join(', then ');
}

/** A policy reason as a sentence, which is how the backend writes them but for the first letter. */
export function reasonWords(reason: string): string {
  return reason.charAt(0).toUpperCase() + reason.slice(1);
}

/** A supplier with no line received in full has neither an on-time share nor a lead time: the backend writes both as nought. */
export function hasDeliveryRecord(performance: {
  onTimeDeliveryBps: number;
  averageLeadTimeDays: number;
}): boolean {
  return performance.onTimeDeliveryBps > 0 || performance.averageLeadTimeDays > 0;
}

/**
 * A supplier with nothing received and nothing defective has no quality on
 * record: the backend scores it 100, which is no delivery rather than a good one.
 */
export function hasQualityRecord(performance: {
  onTimeDeliveryBps: number;
  averageLeadTimeDays: number;
  defectRateBps: number;
}): boolean {
  return hasDeliveryRecord(performance) || performance.defectRateBps > 0;
}

/** The median of a list of numbers, or null for none. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/**
 * Who holds a procurement command, in the words PM-02 and RP-09 name them:
 * the roles `ROLE_DEFINITIONS` grants it to.
 */
export const HOLDERS: Record<string, string> = {
  'suppliers.manage': 'an administrator or a procurement manager',
  'purchase_orders.create': 'a buyer, a procurement manager or an administrator',
  'purchase_orders.edit': 'a buyer, a procurement manager or an administrator',
  'purchase_orders.submit': 'a buyer, a procurement manager or an administrator',
  'purchase_orders.send': 'a buyer, a procurement manager or an administrator',
  'purchase_orders.cancel': 'a procurement manager or an administrator',
  'purchase_orders.approve': 'a procurement manager, a finance manager or an administrator',
  'receipts.create': 'a warehouse operator or manager of the destination, a procurement manager or an administrator',
  'cost.view': 'a buyer, a procurement manager, a finance manager, a sales manager, an auditor or an administrator',
};
