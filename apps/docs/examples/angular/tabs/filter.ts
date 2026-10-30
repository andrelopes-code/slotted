import { Component, computed, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
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
import { SlTab, SlTabEnd, SlTabList, SlTabs } from '@slotted/angular/tabs';

const ORDERS = [
  { id: 'SO-1187', customer: 'Harbor & Pine', status: 'open', total: '$1,240.00' },
  { id: 'SO-1188', customer: 'Brightline Studio', status: 'shipped', total: '$318.50' },
  { id: 'SO-1190', customer: 'Northgate Labs', status: 'open', total: '$2,906.10' },
  { id: 'SO-1191', customer: 'Verde Kitchen', status: 'delayed', total: '$86.00' },
  { id: 'SO-1193', customer: 'Quill & Co.', status: 'shipped', total: '$540.25' },
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'shipped', label: 'Shipped' },
];

const STATUS: Record<string, string> = { open: 'Open', delayed: 'Delayed', shipped: 'Shipped' };

const matching = (filter: string) =>
  filter === 'all' ? ORDERS : ORDERS.filter((order) => order.status === filter);

@Component({
  selector: 'app-tabs-filter',
  imports: [
    SlBadge,
    SlStack,
    SlTab,
    SlTabEnd,
    SlTabList,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTabs,
  ],
  template: `
    <div slStack [gap]="4">
      <div slTabs size="sm" [value]="filter()" (valueChange)="filter.set($event.value ?? filter())">
        <div slTabList aria-label="Orders by status">
          @for (item of filters; track item.value) {
            <div slTab controls="orders-by-status" [value]="item.value">
              {{ item.label }}
              <span slTabEnd
                ><span slBadge showZero size="sm" [count]="matching(item.value).length"></span
              ></span>
            </div>
          }
        </div>
      </div>
      <div slTable id="orders-by-status" [columns]="4">
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
                <td slTableCell>{{ status[order.status] }}</td>
                <td slTableCell numeric>{{ order.total }}</td>
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class TabsFilter {
  protected readonly filters = FILTERS;
  protected readonly status = STATUS;
  protected readonly matching = matching;
  protected readonly filter = signal('all');
  protected readonly rows = computed(() => matching(this.filter()));
}
