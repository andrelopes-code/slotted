import { Component, computed, signal } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
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
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';

const ORDERS = [
  { id: 'SO-10482', customer: 'Harbor & Pine', status: 'open', channel: 'web', total: '$1,240.00' },
  {
    id: 'SO-10483',
    customer: 'Brightline Studio',
    status: 'on-hold',
    channel: 'phone',
    total: '$318.50',
  },
  {
    id: 'SO-10484',
    customer: 'Northgate Labs',
    status: 'shipped',
    channel: 'wholesale',
    total: '$2,906.10',
  },
  { id: 'SO-10485', customer: 'Verde Kitchen', status: 'delayed', channel: 'web', total: '$86.00' },
  {
    id: 'SO-10486',
    customer: 'Quill & Co.',
    status: 'shipped',
    channel: 'marketplace',
    total: '$540.25',
  },
  {
    id: 'SO-10487',
    customer: 'Atlas Freight',
    status: 'open',
    channel: 'wholesale',
    total: '$1,912.00',
  },
  { id: 'SO-10488', customer: 'Lumen Dental', status: 'open', channel: 'web', total: '$472.80' },
  {
    id: 'SO-10489',
    customer: 'Cobalt Outfitters',
    status: 'delayed',
    channel: 'marketplace',
    total: '$1,055.40',
  },
];

const STATUSES: MultiSelectOption[] = [
  { value: 'open', label: 'Open' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'shipped', label: 'Shipped' },
];

const CHANNELS: MultiSelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'phone', label: 'Phone orders' },
];

type Facet = 'status' | 'channel';

const labelOf = (options: MultiSelectOption[], value: string) =>
  options.find((option) => option.value === value)?.label;

const countOf = (facet: Facet, value: string) => {
  const count = ORDERS.filter((order) => order[facet] === value).length;
  return count === 1 ? '1 order' : `${count} orders`;
};

@Component({
  selector: 'app-multi-select-filter-bar',
  imports: [
    SlGrid,
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
    SlTableRowHeader,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <div slGrid [columns]="2" [gap]="3">
        <sl-multi-select
          aria-label="Status"
          placeholder="All statuses"
          size="sm"
          overflow="collapse"
          [items]="statusOptions"
          [(value)]="statuses"
        >
          @for (status of statusOptions; track status.value) {
            <sl-multi-select-item
              [value]="status.value"
              [label]="status.label"
              [description]="countOf('status', status.value)"
            />
          }
        </sl-multi-select>
        <sl-multi-select
          aria-label="Channel"
          placeholder="All channels"
          size="sm"
          overflow="collapse"
          [items]="channelOptions"
          [(value)]="channels"
        >
          @for (channel of channelOptions; track channel.value) {
            <sl-multi-select-item
              [value]="channel.value"
              [label]="channel.label"
              [description]="countOf('channel', channel.value)"
            />
          }
        </sl-multi-select>
      </div>
      <span slText size="sm" tone="muted">{{ rows().length }} of {{ orders.length }} orders</span>
      <div slTable [columns]="5">
        <div slTableContent aria-label="Orders">
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Order</th>
              <th slTableColumnHeader>Customer</th>
              <th slTableColumnHeader>Status</th>
              <th slTableColumnHeader>Channel</th>
              <th slTableColumnHeader numeric>Total</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (order of rows(); track order.id) {
              <tr slTableRow [value]="order.id">
                <th slTableRowHeader>{{ order.id }}</th>
                <td slTableCell>{{ order.customer }}</td>
                <td slTableCell>{{ labelOf(statusOptions, order.status) }}</td>
                <td slTableCell>{{ labelOf(channelOptions, order.channel) }}</td>
                <td slTableCell numeric>{{ order.total }}</td>
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class MultiSelectFilterBar {
  protected readonly orders = ORDERS;
  protected readonly statusOptions = STATUSES;
  protected readonly channelOptions = CHANNELS;
  protected readonly labelOf = labelOf;
  protected readonly countOf = countOf;
  protected readonly statuses = signal<readonly string[]>(['open', 'delayed']);
  protected readonly channels = signal<readonly string[]>([]);
  protected readonly rows = computed(() => {
    const statuses = this.statuses();
    const channels = this.channels();
    return ORDERS.filter(
      (order) =>
        (statuses.length === 0 || statuses.includes(order.status)) &&
        (channels.length === 0 || channels.includes(order.channel)),
    );
  });
}
