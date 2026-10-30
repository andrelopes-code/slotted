import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { GridColumn } from '@slotted/core/grid';
import type {
  CustomerHealth,
  CustomerListItem,
  CustomerStatus,
  Money,
} from '@slotted/demo-nexora-backend';

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  prospect: 'Prospect',
  active: 'Active',
  on_hold: 'On hold',
  inactive: 'Inactive',
  closed: 'Closed',
};

export const STATUS_TONE: Record<CustomerStatus, 'secondary' | 'accent' | 'warning' | 'success'> = {
  prospect: 'accent',
  active: 'success',
  on_hold: 'warning',
  inactive: 'secondary',
  closed: 'secondary',
};

export const HEALTH_LABEL: Record<CustomerHealth, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  at_risk: 'At risk',
};

export const HEALTH_STATUS: Record<CustomerHealth, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  watch: 'warning',
  at_risk: 'danger',
};

export const SEGMENT_LABEL: Record<string, string> = {
  smb: 'SMB',
  mid_market: 'Mid-market',
  enterprise: 'Enterprise',
  strategic: 'Strategic',
};

export const TERMS_LABEL: Record<string, string> = {
  DUE_ON_RECEIPT: 'Due on receipt',
  NET_15: 'Net 15',
  NET_30: 'Net 30',
  NET_45: 'Net 45',
  NET_60: 'Net 60',
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

/**
 * Every column reads the backend field it is named after, so the sort key
 * travels as it is; the two scaled fields show the unit an operator reads,
 * percent and currency, and the query scales them back. The name has no
 * priority and stays at every width; the rest move into the rows' pop-in from
 * the highest priority down (LP-01), so a phone's row leads with the name and
 * the health.
 */
export const CUSTOMER_COLUMNS: readonly GridColumn<CustomerListItem>[] = [
  {
    id: 'displayName',
    label: 'Customer',
    rowHeader: true,
    flex: 1,
    minWidth: 180,
    hideable: false,
  },
  { id: 'accountNumber', label: 'Account', width: 120, text: 'nowrap', priority: 4 },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    options: options(STATUS_LABEL),
    width: 132,
    priority: 2,
    description: 'Where the account is in its life: prospect, active, on hold, inactive or closed.',
  },
  {
    id: 'health',
    label: 'Health',
    kind: 'set',
    options: options(HEALTH_LABEL),
    width: 132,
    priority: 1,
    description:
      'Computed by Nexora from overdue receivables against the credit limit, escalated tickets, satisfaction scores and delayed orders.',
  },
  {
    id: 'segment',
    label: 'Segment',
    kind: 'set',
    options: options(SEGMENT_LABEL),
    width: 120,
    priority: 8,
    format: (value) => SEGMENT_LABEL[String(value)] ?? String(value ?? ''),
  },
  { id: 'accountOwnerName', label: 'Owner', width: 150, priority: 7 },
  {
    id: 'city',
    label: 'City',
    width: 150,
    priority: 10,
    accessor: (row) => (row.city ? `${row.city}, ${row.region ?? ''}`.replace(/, $/, '') : ''),
  },
  {
    id: 'creditUtilizationBps',
    label: 'Credit used',
    kind: 'number',
    width: 160,
    priority: 5,
    description: 'Credit exposure — receivables plus open orders — as a share of the credit limit.',
    accessor: (row) => row.summary.creditUtilizationBps / 100,
    format: (value) => `${Math.round(Number(value))}%`,
  },
  {
    id: 'grossReceivables',
    label: 'Receivables',
    kind: 'number',
    width: 152,
    priority: 9,
    description: 'What the customer owes on invoices, before unapplied credit.',
    accessor: (row) => row.summary.grossReceivables.minor / 100,
    format: (_value, row) => formatMoney(row.summary.grossReceivables),
  },
  {
    id: 'overdueReceivables',
    label: 'Overdue',
    kind: 'number',
    width: 140,
    priority: 3,
    description: 'The part of the receivables past its due date.',
    accessor: (row) => row.summary.overdueReceivables.minor / 100,
    format: (_value, row) => formatMoney(row.summary.overdueReceivables),
  },
  {
    id: 'openOrderCount',
    label: 'Open orders',
    kind: 'number',
    width: 112,
    priority: 6,
    accessor: (row) => row.summary.openOrderCount,
  },
  {
    id: 'openTicketCount',
    label: 'Open tickets',
    kind: 'number',
    width: 112,
    priority: 11,
    accessor: (row) => row.summary.openTicketCount,
  },
  {
    id: 'customerSince',
    label: 'Since',
    kind: 'date',
    width: 128,
    priority: 12,
    description: 'The date the account became a customer.',
  },
];

export const CUSTOMER_FILTER_FIELDS: readonly FilterBarField[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'set',
    options: options(STATUS_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'segment',
    label: 'Segment',
    kind: 'set',
    options: options(SEGMENT_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'health',
    label: 'Health',
    kind: 'set',
    options: options(HEALTH_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'accountOwnerName',
    label: 'Owner',
    kind: 'text',
    pinned: true,
    operators: ['contains', 'equals'],
  },
  /* The seeded "My accounts" view filters by the owner's id; the field exists so the view applies. */
  {
    key: 'accountOwnerId',
    label: 'Owner ID',
    kind: 'text',
    operators: ['equals'],
    section: 'Account',
  },
  {
    key: 'regionCode',
    label: 'Region',
    kind: 'set',
    options: [
      { value: 'US', label: 'United States' },
      { value: 'BR', label: 'Brazil' },
    ],
    operators: ['anyOf'],
    section: 'Account',
  },
  {
    key: 'industry',
    label: 'Industry',
    kind: 'text',
    operators: ['contains', 'equals'],
    section: 'Account',
  },
  { key: 'tags', label: 'Tag', kind: 'text', operators: ['contains'], section: 'Account' },
  {
    key: 'paymentTermsCode',
    label: 'Payment terms',
    kind: 'set',
    options: options(TERMS_LABEL),
    operators: ['anyOf'],
    section: 'Account',
  },
  {
    key: 'customerSince',
    label: 'Customer since',
    kind: 'date',
    operators: ['after', 'before', 'between'],
    section: 'Account',
  },
  {
    key: 'creditUtilizationBps',
    label: 'Credit used (%)',
    kind: 'number',
    operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
    section: 'Exposure',
  },
  {
    key: 'overdueReceivables',
    label: 'Overdue receivables',
    kind: 'number',
    operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
    section: 'Exposure',
  },
  {
    key: 'openOrderCount',
    label: 'Open orders',
    kind: 'number',
    operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'equals'],
    section: 'Exposure',
  },
];
