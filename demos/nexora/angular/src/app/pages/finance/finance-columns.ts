import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { FilterGroup } from '@slotted/core/filter';
import type { GridColumn } from '@slotted/core/grid';
import type { InvoiceListItem } from '@slotted/demo-nexora-backend';

import { doorOnlyField, regionField, segmentField } from '../../core/backend/door';
import { formatDate, formatDateTime, formatMoney, options } from '../../core/catalog/catalog.model';
import {
  agingWords,
  COLLECTION_LABEL,
  INVOICE_STATUS_LABEL,
  LIFECYCLE_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  SETTLEMENT_LABEL,
  type PaymentListItem,
} from '../../core/finance/finance.model';
import { PAYMENT_TERMS_LABEL } from '../../core/procurement/procurement.model';

type Can = (permission: string) => boolean;

const CURRENCIES = { USD: 'USD', EUR: 'EUR', GBP: 'GBP', BRL: 'BRL' };

/**
 * The invoices' columns. Every column is a field `invoiceResource` sorts and
 * filters by, or says it does not (`filterable: false`). The amounts are drawn
 * in the invoice's own currency and compared by the resource in US dollars, so
 * a column sorted by what is owed puts an invoice in reais where its dollars
 * put it. The phone keeps the number, what is owed and the status (LP-01).
 */
export function invoiceColumns(can: Can, today: string): readonly GridColumn<InvoiceListItem>[] {
  return [
    {
      id: 'invoiceNumber',
      label: 'Invoice',
      rowHeader: true,
      width: 156,
      hideable: false,
      accessor: (row) => row.invoiceNumber ?? 'Draft',
    },
    {
      id: 'displayStatus',
      label: 'Status',
      kind: 'set',
      options: options(INVOICE_STATUS_LABEL),
      width: 144,
      priority: 2,
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      kind: 'number',
      align: 'end',
      width: 172,
      priority: 1,
      description: 'What the invoice still owes, in its own currency; sorted and filtered by its value in US dollars.',
      accessor: (row) => row.outstanding.minor / 100,
      format: (_value, row) => formatMoney(row.outstanding),
    },
    { id: 'customerName', label: 'Customer', width: 220, priority: 3 },
    {
      id: 'dueDate',
      label: 'Due',
      kind: 'date',
      width: 196,
      priority: 4,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'daysOverdue',
      label: 'Aging',
      kind: 'number',
      width: 196,
      priority: 5,
      description:
        'Where an open invoice that still owes stands against its due date. A dispute does not stop the count. Sorted by days past due.',
      format: (_value, row) => agingWords(row, today),
    },
    {
      id: 'total',
      label: 'Total',
      kind: 'number',
      align: 'end',
      width: 140,
      priority: 6,
      description: 'Lines, tax and freight, in the invoice’s own currency; sorted by its value in US dollars.',
      accessor: (row) => row.total.minor / 100,
      format: (_value, row) => formatMoney(row.total),
    },
    ...(can('orders.view')
      ? [{ id: 'orderNumber', label: 'Order', width: 156, priority: 7 } satisfies GridColumn<InvoiceListItem>]
      : []),
    { id: 'currency', label: 'Currency', kind: 'set', options: options(CURRENCIES), width: 112, priority: 8 },
    {
      id: 'issueDate',
      label: 'Issued',
      kind: 'date',
      width: 136,
      priority: 9,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'paymentTermsCode',
      label: 'Terms',
      kind: 'set',
      options: options(PAYMENT_TERMS_LABEL),
      width: 136,
      priority: 10,
      format: (value) => PAYMENT_TERMS_LABEL[value as keyof typeof PAYMENT_TERMS_LABEL] ?? String(value),
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      kind: 'date',
      width: 170,
      priority: 11,
      filterable: false,
      accessor: (row) => row.metadata.updatedAt,
      format: (value) => formatDateTime(String(value)),
    },
  ];
}

/**
 * The fields `invoiceResource` filters by. The three axes of §66.2 are three
 * fields, and the composite status a fourth: a reader filters by the one they
 * think in. The amounts are asked in US dollars, which is what the resource
 * compares. The kinds and operators are the ones the overview's doors write
 * (`invoiceDoorFilter`), so a door's pills are the bar's own.
 */
export function invoiceFilterFields(): readonly FilterBarField[] {
  return [
    {
      key: 'displayStatus',
      label: 'Status',
      kind: 'set',
      options: options(INVOICE_STATUS_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'collectionState',
      label: 'Collection',
      kind: 'set',
      options: options(COLLECTION_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'currency',
      label: 'Currency',
      kind: 'set',
      options: options(CURRENCIES),
      pinned: true,
      operators: ['anyOf'],
    },
    { key: 'customerName', label: 'Customer', kind: 'text', operators: ['contains'], section: 'Invoice' },
    { key: 'orderNumber', label: 'Order', kind: 'text', operators: ['contains'], section: 'Invoice' },
    {
      key: 'lifecycle',
      label: 'Lifecycle',
      kind: 'set',
      options: options(LIFECYCLE_LABEL),
      operators: ['anyOf'],
      section: 'Invoice',
    },
    {
      key: 'settlement',
      label: 'Settlement',
      kind: 'set',
      options: options(SETTLEMENT_LABEL),
      operators: ['anyOf'],
      section: 'Invoice',
    },
    {
      key: 'paymentTermsCode',
      label: 'Terms',
      kind: 'set',
      options: options(PAYMENT_TERMS_LABEL),
      operators: ['anyOf'],
      section: 'Invoice',
    },
    { key: 'dueDate', label: 'Due', kind: 'date', operators: ['after', 'before', 'between'], section: 'Dates' },
    { key: 'issueDate', label: 'Issued', kind: 'date', operators: ['after', 'before', 'between'], section: 'Dates' },
    {
      key: 'daysOverdue',
      label: 'Days past due',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Dates',
    },
    {
      key: 'outstanding',
      label: 'Outstanding (US$)',
      kind: 'number',
      operators: ['greaterThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Amounts',
    },
    {
      key: 'total',
      label: 'Total (US$)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Amounts',
    },
    regionField('Customer') as FilterBarField,
    segmentField('Customer') as FilterBarField,
  ];
}

/**
 * The payments' columns. The unapplied amount leads the phone's row after the
 * amount: it is the credit the customer holds and the work the payment still
 * owes Finance.
 */
export function paymentColumns(): readonly GridColumn<PaymentListItem>[] {
  return [
    { id: 'paymentNumber', label: 'Payment', rowHeader: true, width: 148, hideable: false },
    {
      id: 'amount',
      label: 'Amount',
      kind: 'number',
      align: 'end',
      width: 156,
      priority: 1,
      description: 'In the payment’s own currency; sorted and filtered by its value in US dollars.',
      accessor: (row) => row.amount.minor / 100,
      format: (_value, row) => formatMoney(row.amount),
    },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: options(PAYMENT_STATUS_LABEL),
      width: 132,
      priority: 3,
    },
    { id: 'customerName', label: 'Customer', width: 220, priority: 4 },
    {
      id: 'unappliedAmount',
      label: 'Unapplied',
      kind: 'number',
      align: 'end',
      width: 172,
      priority: 2,
      description: 'What no invoice has taken yet: credit the customer holds. Sorted by its value in US dollars.',
      accessor: (row) => row.unappliedAmount.minor / 100,
      format: (_value, row) => (row.unappliedAmount.minor > 0 ? formatMoney(row.unappliedAmount) : ''),
    },
    {
      id: 'receivedDate',
      label: 'Received',
      kind: 'date',
      width: 136,
      priority: 5,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'method',
      label: 'Method',
      kind: 'set',
      options: options(PAYMENT_METHOD_LABEL),
      width: 132,
      priority: 6,
      format: (value) => PAYMENT_METHOD_LABEL[value as keyof typeof PAYMENT_METHOD_LABEL] ?? String(value),
    },
    {
      id: 'invoiceNumbers',
      label: 'Invoices',
      width: 200,
      priority: 7,
      sortable: false,
      filterable: false,
      accessor: (row) => row.invoiceNumbers.join(', '),
    },
    { id: 'reference', label: 'Reference', width: 160, priority: 8 },
    { id: 'currency', label: 'Currency', kind: 'set', options: options(CURRENCIES), width: 112, priority: 9, accessor: (row) => row.amount.currency },
  ];
}

/** The fields `paymentResource` filters by; the amounts in US dollars. */
export function paymentFilterFields(): readonly FilterBarField[] {
  return [
    {
      key: 'status',
      label: 'Status',
      kind: 'set',
      options: options(PAYMENT_STATUS_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'method',
      label: 'Method',
      kind: 'set',
      options: options(PAYMENT_METHOD_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'currency',
      label: 'Currency',
      kind: 'set',
      options: options(CURRENCIES),
      pinned: true,
      operators: ['anyOf'],
    },
    { key: 'customerName', label: 'Customer', kind: 'text', operators: ['contains'], section: 'Payment' },
    { key: 'reference', label: 'Reference', kind: 'text', operators: ['contains'], section: 'Payment' },
    {
      key: 'receivedDate',
      label: 'Received',
      kind: 'date',
      operators: ['after', 'before', 'between'],
      section: 'Payment',
    },
    {
      key: 'amount',
      label: 'Amount (US$)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Amounts',
    },
    {
      key: 'unappliedAmount',
      label: 'Unapplied (US$)',
      kind: 'number',
      operators: ['greaterThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Amounts',
    },
    regionField('Customer') as FilterBarField,
    segmentField('Customer') as FilterBarField,
  ];
}

/** What a report's door may name that a finance list has no list of: offered while the door names it. */
export const FINANCE_DOOR_FIELDS: readonly FilterBarField[] = [doorOnlyField('customerId', 'Customer') as FilterBarField];

/**
 * The overview's doors into the payments (OV-01): `received=month` is what
 * "cash collected this month" counts — posted payments from the first of the
 * demo month to today; `unapplied=1` is the posted payments no invoice has
 * taken all of.
 */
export function paymentDoorFilter(
  params: { get(name: string): string | null },
  today: string,
): FilterGroup | null {
  const posted = {
    field: 'status',
    filter: { kind: 'set' as const, join: 'and' as const, conditions: [{ operator: 'anyOf' as const, value: ['posted'] }] },
  };
  if (params.get('received') === 'month')
    return {
      join: 'and',
      rules: [
        posted,
        {
          field: 'receivedDate',
          filter: {
            kind: 'date',
            join: 'and',
            conditions: [{ operator: 'between', value: `${today.slice(0, 7)}-01`, end: today }],
          },
        },
      ],
    };
  if (params.get('unapplied') === '1')
    return {
      join: 'and',
      rules: [
        posted,
        {
          field: 'unappliedAmount',
          filter: { kind: 'number', join: 'and', conditions: [{ operator: 'greaterThan', value: 0 }] },
        },
      ],
    };
  return null;
}
