import type { FilterBarField } from '@slotted/angular/filter-bar';

import { doorOnlyField, regionField, segmentField } from '../../core/backend/door';
import type { GridColumn } from '@slotted/core/grid';
import type { Money, OrderListItem } from '@slotted/demo-nexora-backend';

/** The words the module says for every state the backend stores (§59). */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  confirmed: 'Confirmed',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
  closed: 'Closed',
};

export const ORDER_STATUS_TONE: Record<
  string,
  'secondary' | 'accent' | 'warning' | 'success' | 'danger'
> = {
  draft: 'secondary',
  pending_approval: 'warning',
  confirmed: 'accent',
  on_hold: 'warning',
  cancelled: 'danger',
  closed: 'success',
};

export const APPROVAL_LABEL: Record<string, string> = {
  not_required: 'Not required',
  pending: 'Waiting',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const FULFILLMENT_LABEL: Record<string, string> = {
  unfulfilled: 'Not shipped',
  partially_fulfilled: 'Part shipped',
  fulfilled: 'Shipped',
  partially_returned: 'Part returned',
  returned: 'Returned',
};

export const ALLOCATION_LABEL: Record<string, string> = {
  unallocated: 'Not reserved',
  partially_allocated: 'Part reserved',
  allocated: 'Reserved',
};

export const INVOICE_LABEL: Record<string, string> = {
  not_invoiced: 'Not invoiced',
  partially_invoiced: 'Part invoiced',
  invoiced: 'Invoiced',
};

export const PAYMENT_LABEL: Record<string, string> = {
  not_invoiced: 'Not invoiced',
  unpaid: 'Unpaid',
  partially_paid: 'Part paid',
  paid: 'Paid',
  overdue: 'Overdue',
  partially_refunded: 'Part refunded',
  refunded: 'Refunded',
};

/** What a risk flag means to the operator who has to act on it (§59, §82). */
export const RISK_LABEL: Record<string, string> = {
  credit_limit_exceeded: 'Over credit limit',
  low_margin: 'Below target margin',
  high_discount: 'Discount above policy',
  inventory_shortage: 'Short on stock',
  requested_date_at_risk: 'Date at risk',
  customer_on_hold: 'Account on hold',
  overdue_receivables: 'Account overdue',
};

export const RISK_TONE: Record<string, 'warning' | 'danger'> = {
  credit_limit_exceeded: 'danger',
  low_margin: 'warning',
  high_discount: 'warning',
  inventory_shortage: 'danger',
  requested_date_at_risk: 'warning',
  customer_on_hold: 'danger',
  overdue_receivables: 'warning',
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  converted: 'Converted',
  cancelled: 'Cancelled',
};

export const QUOTE_STATUS_TONE: Record<
  string,
  'secondary' | 'accent' | 'warning' | 'success' | 'danger'
> = {
  draft: 'secondary',
  pending_approval: 'warning',
  approved: 'accent',
  sent: 'accent',
  viewed: 'accent',
  accepted: 'success',
  rejected: 'danger',
  expired: 'secondary',
  converted: 'success',
  cancelled: 'secondary',
};

const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export function formatMoney(money: Money, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.minor / 100);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

/**
 * Every column reads the backend field it is named after, so a sort key
 * travels as it is. The order number has no priority and stays at every
 * width; the rest move into the rows' pop-in from the highest priority down
 * (LP-01).
 */
export const ORDER_COLUMNS: readonly GridColumn<OrderListItem>[] = [
  { id: 'orderNumber', label: 'Order', kind: 'text', rowHeader: true, width: 130 },
  { id: 'customerName', label: 'Customer', kind: 'text', width: 190, priority: 2 },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    options: options(ORDER_STATUS_LABEL),
    width: 140,
    priority: 1,
    description: 'The step of the order cycle the order stands at, and the steps left.',
  },
  {
    id: 'approvalStatus',
    label: 'Approval',
    kind: 'set',
    options: options(APPROVAL_LABEL),
    width: 130,
    priority: 6,
    description: 'Whether a risk on the order asks for an approval, and where that approval stands.',
  },
  {
    id: 'riskFlags',
    label: 'Risk',
    kind: 'text',
    width: 152,
    priority: 4,
    description:
      'What Nexora flagged on the order: credit, margin, discount, stock, delivery date or the account itself.',
  },
  {
    id: 'fulfillmentStatus',
    label: 'Fulfilment',
    kind: 'set',
    options: options(FULFILLMENT_LABEL),
    width: 130,
    priority: 5,
  },
  {
    id: 'total',
    label: 'Total',
    kind: 'number',
    align: 'end',
    width: 120,
    priority: 3,
    format: (value) => (typeof value === 'number' ? `${(value / 100).toFixed(0)}` : ''),
  },
  {
    id: 'grossMarginBps',
    label: 'Margin',
    kind: 'number',
    align: 'end',
    width: 128,
    priority: 7,
    description: 'Gross margin as a share of the net total, after discounts.',
  },
  {
    id: 'orderDate',
    label: 'Ordered',
    kind: 'date',
    width: 136,
    priority: 8,
    description: 'The business date the order was placed.',
  },
  {
    id: 'requestedDeliveryDate',
    label: 'Requested',
    kind: 'date',
    width: 150,
    priority: 9,
    description: 'The delivery date the customer asked for.',
  },
  { id: 'ownerName', label: 'Owner', kind: 'text', width: 170, priority: 10 },
  { id: 'lineCount', label: 'Lines', kind: 'number', align: 'end', width: 90, priority: 11 },
  { id: 'customerPoNumber', label: 'Customer PO', kind: 'text', width: 150, priority: 12 },
];

/**
 * Thirteen columns do not fit a 1280 frame. The eight a sales manager scans
 * are drawn; the rest are a column control away and every one of them is a
 * filter in the bar.
 */
export const ORDER_HIDDEN_COLUMN_IDS: readonly string[] = [
  'approvalStatus',
  'requestedDeliveryDate',
  'ownerName',
  'lineCount',
  'customerPoNumber',
];

export const ORDER_FILTER_FIELDS: readonly FilterBarField[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'set',
    options: options(ORDER_STATUS_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'approvalStatus',
    label: 'Approval',
    kind: 'set',
    options: options(APPROVAL_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'fulfillmentStatus',
    label: 'Fulfilment',
    kind: 'set',
    options: options(FULFILLMENT_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'riskFlags',
    label: 'Risk',
    kind: 'set',
    options: options(RISK_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  { key: 'customerName', label: 'Customer', kind: 'text', operators: ['contains'] },
  { key: 'ownerName', label: 'Owner', kind: 'text', operators: ['contains'] },
  { key: 'customerPoNumber', label: 'Customer PO', kind: 'text', operators: ['contains'] },
  { key: 'orderDate', label: 'Ordered', kind: 'date' },
  { key: 'requestedDeliveryDate', label: 'Requested', kind: 'date' },
  { key: 'total', label: 'Total', kind: 'number' },
  { key: 'grossMarginBps', label: 'Margin %', kind: 'number' },
  { key: 'lineCount', label: 'Lines', kind: 'number' },
  regionField('Account') as FilterBarField,
  segmentField('Account') as FilterBarField,
  { key: 'cycleDays', label: 'Days to ship complete', kind: 'number' },
];

/** What a report's door may name that the bar has no list of: offered while the door names it. */
export const ORDER_DOOR_FIELDS: readonly FilterBarField[] = [
  doorOnlyField('customerId', 'Account') as FilterBarField,
  doorOnlyField('ownerId', 'Owned by') as FilterBarField,
  doorOnlyField('skuIds', 'Has product') as FilterBarField,
  doorOnlyField('warehouseId', 'Ships from') as FilterBarField,
];

export const ORDER_FILTER_KINDS: Readonly<Record<string, 'set' | 'text' | 'number' | 'date'>> = {
  status: 'set',
  approvalStatus: 'set',
  fulfillmentStatus: 'set',
  riskFlags: 'set',
  customerName: 'text',
  ownerName: 'text',
  customerPoNumber: 'text',
  orderDate: 'date',
  requestedDeliveryDate: 'date',
  total: 'number',
  grossMarginBps: 'number',
  lineCount: 'number',
  regionCode: 'set',
  customerSegment: 'set',
  cycleDays: 'number',
};
