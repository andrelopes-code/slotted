import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { GridColumn } from '@slotted/core/grid';

import { formatDate, formatMoney, options } from '../../core/catalog/catalog.model';
import {
  CREDIT_MEMO_LIFECYCLE_LABEL,
  CREDIT_MEMO_REASON_LABEL,
  type CreditMemoListItem,
} from '../../core/finance/finance.model';
import { regionField, segmentField } from '../../core/backend/door';

/**
 * The credit memos' columns. The amounts are drawn in the memo's own currency
 * and sorted by `creditMemoResource` in US dollars, so a memo in reais takes
 * its place by what it is worth. The unapplied amount leads the phone's row
 * (LP-01): it is the credit still to use.
 */
export function creditMemoColumns(): readonly GridColumn<CreditMemoListItem>[] {
  return [
    { id: 'creditMemoNumber', label: 'Credit memo', rowHeader: true, width: 150, hideable: false },
    {
      id: 'lifecycle',
      label: 'Status',
      kind: 'set',
      options: options(CREDIT_MEMO_LIFECYCLE_LABEL),
      width: 140,
      priority: 2,
    },
    {
      id: 'unappliedAmount',
      label: 'Unapplied',
      kind: 'number',
      align: 'end',
      // The column's help glyph takes 28px beside the label (ledger row "column-help").
      width: 164,
      priority: 1,
      description: 'Credit not yet applied to an invoice or refunded, in the memo’s own currency; sorted in US dollars.',
      accessor: (row) => row.unappliedAmount.minor / 100,
      format: (_value, row) => formatMoney(row.unappliedAmount),
    },
    { id: 'customerName', label: 'Customer', width: 220, priority: 3 },
    {
      id: 'total',
      label: 'Total',
      kind: 'number',
      align: 'end',
      width: 140,
      priority: 4,
      description: 'Amount and tax, in the memo’s own currency; sorted in US dollars.',
      accessor: (row) => row.total.minor / 100,
      format: (_value, row) => formatMoney(row.total),
    },
    {
      id: 'reason',
      label: 'Reason',
      kind: 'set',
      options: options(CREDIT_MEMO_REASON_LABEL),
      width: 170,
      priority: 5,
    },
    {
      id: 'issueDate',
      label: 'Issued',
      kind: 'date',
      width: 130,
      priority: 6,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'source',
      label: 'From',
      width: 160,
      priority: 7,
      // The source is joined from another record: `creditMemoResource` neither sorts nor filters it.
      filterable: false,
      sortable: false,
      accessor: (row) => row.sourceInvoiceNumber ?? row.sourceReturnNumber ?? '',
    },
  ];
}

/** The fields `creditMemoResource` filters by; the amounts in US dollars, as it compares them. */
export function creditMemoFilterFields(): readonly FilterBarField[] {
  return [
    {
      key: 'lifecycle',
      label: 'Status',
      kind: 'set',
      options: options(CREDIT_MEMO_LIFECYCLE_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'reason',
      label: 'Reason',
      kind: 'set',
      options: options(CREDIT_MEMO_REASON_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    { key: 'customerName', label: 'Customer', kind: 'text', operators: ['contains'], section: 'Credit memo' },
    {
      key: 'issueDate',
      label: 'Issued',
      kind: 'date',
      operators: ['after', 'before', 'between'],
      section: 'Credit memo',
    },
    {
      key: 'unappliedAmount',
      label: 'Unapplied (US$)',
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
