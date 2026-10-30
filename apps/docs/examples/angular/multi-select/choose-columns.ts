import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
} from '@slotted/angular/table';

type Column = 'order' | 'customer' | 'placed' | 'items' | 'total';

const COLUMNS: (MultiSelectOption & { value: Column })[] = [
  { value: 'order', label: 'Order' },
  { value: 'customer', label: 'Customer' },
  { value: 'placed', label: 'Placed' },
  { value: 'items', label: 'Items' },
  { value: 'total', label: 'Total' },
];

const ORDERS: Record<Column, string>[] = [
  {
    order: 'SO-10482',
    customer: 'Harbor & Pine',
    placed: 'Oct 2',
    items: '14',
    total: '$1,240.00',
  },
  {
    order: 'SO-10483',
    customer: 'Brightline Studio',
    placed: 'Oct 3',
    items: '3',
    total: '$318.50',
  },
  {
    order: 'SO-10484',
    customer: 'Northgate Labs',
    placed: 'Oct 3',
    items: '41',
    total: '$2,906.10',
  },
];

const ALL = COLUMNS.map((column) => column.value);
const labelOf = (value: string) => COLUMNS.find((column) => column.value === value)?.label;

@Component({
  selector: 'app-multi-select-choose-columns',
  imports: [
    SlButton,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlInline,
    SlMultiSelect,
    SlMultiSelectItem,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <div slInline [gap]="3" justify="between" align="center">
          <label slFieldLabel>Columns</label>
          <button
            slButton
            size="sm"
            tone="secondary"
            variant="ghost"
            [disabled]="shown().length === all.length"
            (click)="shown.set(all)"
          >
            Show all
          </button>
        </div>
        <sl-multi-select reorderable placeholder="Add a column" [items]="options" [(value)]="shown">
          @for (column of options; track column.value) {
            <sl-multi-select-item [value]="column.value" [label]="column.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>
          The table follows the order of the chips. Alt with an arrow moves a focused column.
        </span>
      </div>
      <div slTable [columns]="columnCount()">
        <div slTableContent aria-label="Orders">
          <thead slTableHead>
            <tr slTableRow>
              @for (column of columns(); track column) {
                <th slTableColumnHeader>{{ labelOf(column) }}</th>
              }
            </tr>
          </thead>
          <tbody slTableBody>
            @for (order of orders; track order.order) {
              <tr slTableRow [value]="order.order">
                @for (column of columns(); track column) {
                  <td slTableCell>{{ order[column] }}</td>
                }
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class MultiSelectChooseColumns {
  protected readonly options = COLUMNS;
  protected readonly orders = ORDERS;
  protected readonly all = ALL;
  protected readonly labelOf = labelOf;
  protected readonly shown = signal<readonly string[]>(['order', 'customer', 'total']);
  protected readonly columns = computed(() => this.shown() as readonly Column[]);
  protected readonly columnCount = computed(() => Math.max(this.columns().length, 1));
}
