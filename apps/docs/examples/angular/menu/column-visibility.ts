import { Component, computed, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuGroup, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
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

type Column = 'customer' | 'status' | 'warehouse' | 'total';

const COLUMNS: { key: Column; label: string; numeric?: boolean }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'total', label: 'Total', numeric: true },
];

const ORDERS: (Record<Column, string> & { id: string })[] = [
  {
    id: 'SO-10482',
    customer: 'Northwind Traders',
    status: 'Packed',
    warehouse: 'Rotterdam',
    total: '$1,240.00',
  },
  {
    id: 'SO-10483',
    customer: 'Contoso Foods',
    status: 'Awaiting payment',
    warehouse: 'Leipzig',
    total: '$860.50',
  },
  {
    id: 'SO-10484',
    customer: 'Fabrikam Supply',
    status: 'Shipped',
    warehouse: 'Lyon',
    total: '$2,315.75',
  },
];

@Component({
  selector: 'app-menu-column-visibility',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuTrigger,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slStack align="end" [gap]="3">
      <button slButton size="sm" variant="outline" [slMenuTriggerFor]="columnMenu">
        Columns
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #columnMenu align="end">
        <sl-menu-group label="Show columns">
          @for (column of columns; track column.key) {
            <button
              slMenuCheckboxItem
              [checked]="visible()[column.key]"
              (checkedChange)="toggle(column.key, $event)"
            >
              {{ column.label }}
            </button>
          }
        </sl-menu-group>
      </sl-menu>
      <div slTable [columns]="shown().length + 1">
        <div slTableContent>
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Order</th>
              @for (column of shown(); track column.key) {
                <th slTableColumnHeader [numeric]="column.numeric ?? false">{{ column.label }}</th>
              }
            </tr>
          </thead>
          <tbody slTableBody>
            @for (order of orders; track order.id) {
              <tr slTableRow [value]="order.id">
                <th slTableRowHeader>{{ order.id }}</th>
                @for (column of shown(); track column.key) {
                  <td slTableCell [numeric]="column.numeric ?? false">{{ order[column.key] }}</td>
                }
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class MenuColumnVisibility {
  protected readonly columns = COLUMNS;
  protected readonly orders = ORDERS;
  protected readonly visible = signal<Record<Column, boolean>>({
    customer: true,
    status: true,
    warehouse: false,
    total: true,
  });
  protected readonly shown = computed(() => COLUMNS.filter((column) => this.visible()[column.key]));

  protected toggle(key: Column, checked: boolean): void {
    this.visible.update((current) => ({ ...current, [key]: checked }));
  }
}
