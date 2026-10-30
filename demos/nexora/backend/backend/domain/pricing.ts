import type {
  CurrencyCode,
  Money,
  PaymentTermsCode,
  Quantity,
  RegionCode,
  TaxProfile,
} from './common';
import {
  addMoney,
  applyBps,
  multiplyMoneyByQuantity,
  ratioBps,
  roundHalfUp,
  subtractMoney,
  sumMoney,
} from './money';
import { addDays } from './time';

/** Section 57.8 — deterministic demo sales-tax table by shipping region. */
const TAX_RATE_BPS_BY_REGION: Record<string, number> = {
  IL: 825,
  TX: 625,
  GA: 700,
  CO: 290,
  NJ: 662,
};
export const DEFAULT_TAX_RATE_BPS = 500;

/** Simplified Brazil demo rate by state; not a legal tax engine. */
const BR_TAX_RATE_BPS_BY_STATE: Record<string, number> = {
  SP: 1_800,
  RJ: 2_000,
  MG: 1_800,
  PR: 1_800,
  SC: 1_700,
  RS: 1_700,
  BA: 1_900,
  PE: 1_800,
  CE: 1_800,
  GO: 1_700,
  AM: 2_000,
  ES: 1_700,
};
export const BR_DEFAULT_TAX_RATE_BPS = 1_800;

export function taxRateBpsFor(
  region: string,
  taxProfile: TaxProfile,
  taxClass: 'standard' | 'reduced' | 'exempt' = 'standard',
  regionCode: RegionCode = 'US',
): number {
  if (taxProfile.type === 'exempt' || taxClass === 'exempt') return 0;
  const base =
    regionCode === 'BR'
      ? (BR_TAX_RATE_BPS_BY_STATE[region] ?? BR_DEFAULT_TAX_RATE_BPS)
      : (TAX_RATE_BPS_BY_REGION[region] ?? DEFAULT_TAX_RATE_BPS);
  return taxClass === 'reduced' ? roundHalfUp(base / 2) : base;
}

export interface PricedLine {
  quantity: Quantity;
  listUnitPrice: Money;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  unitCost: Money;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
  extendedCost: Money;
  grossMargin: Money;
  grossMarginBps: number;
}

/** Section 57.7 — line pricing with half-up rounding at every intermediate step. */
export function priceLine(input: {
  quantity: Quantity;
  listUnitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  unitCost: Money;
}): PricedLine {
  const gross = multiplyMoneyByQuantity(input.listUnitPrice, input.quantity);
  const discount = applyBps(gross, input.discountBps);
  const net = subtractMoney(gross, discount);
  const tax = applyBps(net, input.taxRateBps);
  const total = addMoney(net, tax);
  const extendedCost = multiplyMoneyByQuantity(input.unitCost, input.quantity);
  const grossMargin = subtractMoney(net, extendedCost);
  const unitPrice: Money = {
    currency: input.listUnitPrice.currency,
    minor: roundHalfUp(input.listUnitPrice.minor * (1 - input.discountBps / 10_000)),
  };
  return {
    quantity: input.quantity,
    listUnitPrice: input.listUnitPrice,
    unitPrice,
    discountBps: input.discountBps,
    taxRateBps: input.taxRateBps,
    unitCost: input.unitCost,
    netAmount: net,
    taxAmount: tax,
    totalAmount: total,
    extendedCost,
    grossMargin,
    grossMarginBps: ratioBps(grossMargin.minor, net.minor),
  };
}

export interface DocumentTotals {
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  costTotal: Money;
  grossMargin: Money;
  grossMarginBps: number;
}

/** Section 91.2 — header totals are sums of rounded line values. */
export function documentTotals(
  lines: readonly Pick<
    PricedLine,
    'quantity' | 'listUnitPrice' | 'netAmount' | 'taxAmount' | 'extendedCost'
  >[],
  freight: Money,
  currency: CurrencyCode,
): DocumentTotals {
  const grossTotal = sumMoney(
    lines.map((line) => multiplyMoneyByQuantity(line.listUnitPrice, line.quantity)),
    currency,
  );
  const subtotal = sumMoney(
    lines.map((line) => line.netAmount),
    currency,
  );
  const discountTotal = subtractMoney(grossTotal, subtotal);
  const taxTotal = sumMoney(
    lines.map((line) => line.taxAmount),
    currency,
  );
  const costTotal = sumMoney(
    lines.map((line) => line.extendedCost),
    currency,
  );
  const grossMargin = subtractMoney(subtotal, costTotal);
  return {
    subtotal,
    discountTotal,
    taxTotal,
    freight,
    total: addMoney(addMoney(subtotal, taxTotal), freight),
    costTotal,
    grossMargin,
    grossMarginBps: ratioBps(grossMargin.minor, subtotal.minor),
  };
}

export const PAYMENT_TERMS_DAYS: Record<PaymentTermsCode, number> = {
  DUE_ON_RECEIPT: 0,
  NET_15: 15,
  NET_30: 30,
  NET_45: 45,
  NET_60: 60,
};

export function dueDateFor(issueDate: string, terms: PaymentTermsCode): string {
  return addDays(issueDate, PAYMENT_TERMS_DAYS[terms]);
}

export interface ApprovalStepRequirement {
  sequence: number;
  requiredRole: string;
  reason: string;
}

export interface ApprovalEvaluation {
  required: boolean;
  policyCode: string;
  reasons: string[];
  steps: ApprovalStepRequirement[];
}

function dedupeSteps(steps: ApprovalStepRequirement[]): ApprovalStepRequirement[] {
  const byRole = new Map<string, ApprovalStepRequirement>();
  for (const step of steps) {
    const existing = byRole.get(step.requiredRole);
    if (existing) existing.reason = `${existing.reason}; ${step.reason}`;
    else byRole.set(step.requiredRole, { ...step });
  }
  return [...byRole.values()].sort((a, b) => a.sequence - b.sequence);
}

/** Section 58.3 — quote approval policy. Amounts in USD minor units. */
export function evaluateQuoteApproval(input: {
  approvalValueUsdMinor: number;
  grossMarginBps: number;
  maxLineDiscountBps: number;
}): ApprovalEvaluation {
  const steps: ApprovalStepRequirement[] = [];
  const {
    approvalValueUsdMinor: value,
    grossMarginBps: margin,
    maxLineDiscountBps: discount,
  } = input;
  if (value >= 5_000_000)
    steps.push({
      sequence: 1,
      requiredRole: 'sales_manager',
      reason: 'quote value at or above $50,000',
    });
  if (value >= 10_000_000)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'quote value at or above $100,000',
    });
  if (margin < 2_000)
    steps.push({ sequence: 1, requiredRole: 'sales_manager', reason: 'gross margin below 20%' });
  if (margin < 1_500)
    steps.push({ sequence: 2, requiredRole: 'finance_manager', reason: 'gross margin below 15%' });
  if (discount >= 1_500)
    steps.push({
      sequence: 1,
      requiredRole: 'sales_manager',
      reason: 'line discount at or above 15%',
    });
  if (discount >= 2_500)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'line discount at or above 25%',
    });
  const merged = dedupeSteps(steps);
  return {
    required: merged.length > 0,
    policyCode: 'quote.v1',
    reasons: [...new Set(steps.map((step) => step.reason))],
    steps: merged,
  };
}

/** Section 59.4 — sales order approval policy. */
export function evaluateOrderApproval(input: {
  approvalValueUsdMinor: number;
  grossMarginBps: number;
  maxLineDiscountBps: number;
  creditLimitExceeded: boolean;
  customerOnHold: boolean;
}): ApprovalEvaluation {
  const steps: ApprovalStepRequirement[] = [];
  const {
    approvalValueUsdMinor: value,
    grossMarginBps: margin,
    maxLineDiscountBps: discount,
  } = input;
  if (value >= 5_000_000)
    steps.push({
      sequence: 1,
      requiredRole: 'sales_manager',
      reason: 'order value at or above $50,000',
    });
  if (value >= 10_000_000)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'order value at or above $100,000',
    });
  if (margin < 2_200)
    steps.push({ sequence: 1, requiredRole: 'sales_manager', reason: 'gross margin below 22%' });
  if (margin < 1_500)
    steps.push({ sequence: 2, requiredRole: 'finance_manager', reason: 'gross margin below 15%' });
  if (discount >= 1_200)
    steps.push({
      sequence: 1,
      requiredRole: 'sales_manager',
      reason: 'line discount at or above 12%',
    });
  if (discount >= 2_000)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'line discount at or above 20%',
    });
  if (input.creditLimitExceeded)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'credit exposure exceeds credit limit',
    });
  if (input.customerOnHold)
    steps.push({ sequence: 2, requiredRole: 'finance_manager', reason: 'customer is on hold' });
  const merged = dedupeSteps(steps);
  return {
    required: merged.length > 0,
    policyCode: 'sales_order.v1',
    reasons: [...new Set(steps.map((step) => step.reason))],
    steps: merged,
  };
}

/** Section 65.5 — purchase order approval policy. */
export function evaluatePurchaseOrderApproval(input: {
  approvalValueUsdMinor: number;
  supplierConditional: boolean;
  maxCostVarianceBps: number;
}): ApprovalEvaluation {
  const steps: ApprovalStepRequirement[] = [];
  const value = input.approvalValueUsdMinor;
  if (value >= 2_500_000)
    steps.push({
      sequence: 1,
      requiredRole: 'procurement_manager',
      reason: 'purchase order value at or above $25,000',
    });
  if (value >= 10_000_000)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'purchase order value at or above $100,000',
    });
  if (input.supplierConditional)
    steps.push({
      sequence: 1,
      requiredRole: 'procurement_manager',
      reason: 'supplier relationship tier is conditional',
    });
  if (input.maxCostVarianceBps > 1_500)
    steps.push({
      sequence: 1,
      requiredRole: 'procurement_manager',
      reason: 'unit cost variance above 15%',
    });
  if (input.maxCostVarianceBps > 3_000)
    steps.push({
      sequence: 2,
      requiredRole: 'finance_manager',
      reason: 'unit cost variance above 30%',
    });
  const merged = dedupeSteps(steps);
  return {
    required: merged.length > 0,
    policyCode: 'purchase_order.v1',
    reasons: [...new Set(steps.map((step) => step.reason))],
    steps: merged,
  };
}

/** Section 66.5 — write-off authority by outstanding amount (USD minor). */
export function writeOffAuthority(
  outstandingUsdMinor: number,
): 'accountant' | 'finance_manager' | 'approval_request' {
  if (outstandingUsdMinor <= 50_000) return 'accountant';
  if (outstandingUsdMinor <= 500_000) return 'finance_manager';
  return 'approval_request';
}
