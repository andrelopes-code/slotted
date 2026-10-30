import { Component, computed, signal } from '@angular/core';
import type { GlyphName } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import {
  SlSelect,
  SlSelectItem,
  SlSelectSeparator,
  type SelectOption,
  type SelectSelection,
} from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';

const ORDERS = [
  { id: 'SO-10482', customer: 'Harbor & Pine', status: 'open', total: '$1,240.00' },
  { id: 'SO-10483', customer: 'Brightline Studio', status: 'on-hold', total: '$318.50' },
  { id: 'SO-10484', customer: 'Northgate Labs', status: 'shipped', total: '$2,906.10' },
  { id: 'SO-10485', customer: 'Verde Kitchen', status: 'delayed', total: '$86.00' },
  { id: 'SO-10486', customer: 'Quill & Co.', status: 'shipped', total: '$540.25' },
  { id: 'SO-10487', customer: 'Atlas Freight', status: 'open', total: '$1,912.00' },
];

const STATUSES: (SelectOption & { icon: GlyphName })[] = [
  { value: 'open', label: 'Open', icon: 'circle' },
  { value: 'on-hold', label: 'On hold', icon: 'clock' },
  { value: 'delayed', label: 'Delayed', icon: 'triangle-alert' },
  { value: 'shipped', label: 'Shipped', icon: 'circle-check' },
];

const ALL: SelectOption = { value: 'all', label: 'All statuses' };

@Component({
  selector: 'app-select-status-filter',
  imports: [
    SlInline,
    SlSelect,
    SlSelectItem,
    SlSelectSeparator,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="3" justify="between" align="center">
        <span slText size="sm" tone="muted">{{ rows().length }} of {{ orders.length }} orders</span>
        <sl-select
          aria-label="Filter by status"
          size="sm"
          align="end"
          [fullWidth]="false"
          [items]="options"
          [(value)]="status"
        >
          <sl-select-item [value]="all.value">{{ all.label }}</sl-select-item>
          <sl-select-separator />
          @for (option of statuses; track option.value) {
            <sl-select-item [value]="option.value" [icon]="option.icon">{{
              option.label
            }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slTable [columns]="4">
        <div slTableContent aria-label="Orders">
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Order</th>
              <th slTableColumnHeader>Customer</th>
              <th slTableColumnHeader>Status</th>
              <th slTableColumnHeader numeric>Total</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (order of rows(); track order.id) {
              <tr slTableRow [value]="order.id">
                <th slTableRowHeader>{{ order.id }}</th>
                <td slTableCell>{{ order.customer }}</td>
                <td slTableCell>{{ labelOf(order.status) }}</td>
                <td slTableCell numeric>{{ order.total }}</td>
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class SelectStatusFilter {
  protected readonly orders = ORDERS;
  protected readonly statuses = STATUSES;
  protected readonly all = ALL;
  protected readonly options = [ALL, ...STATUSES];
  protected readonly status = signal<SelectSelection>('all');
  protected readonly rows = computed(() => {
    const status = this.status();
    return status === 'all' ? ORDERS : ORDERS.filter((order) => order.status === status);
  });

  protected labelOf(status: string): string | undefined {
    return STATUSES.find((option) => option.value === status)?.label;
  }
}
