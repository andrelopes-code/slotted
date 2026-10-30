import { useState } from 'react';
import { Grid } from '@slotted/react/grid';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import { Stack } from '@slotted/react/stack';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';
import { Text } from '@slotted/react/typography';

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

export default function MultiSelectFilterBar() {
  const [statuses, setStatuses] = useState<readonly string[]>(['open', 'delayed']);
  const [channels, setChannels] = useState<readonly string[]>([]);

  const rows = ORDERS.filter(
    (order) =>
      (statuses.length === 0 || statuses.includes(order.status)) &&
      (channels.length === 0 || channels.includes(order.channel)),
  );

  return (
    <Stack gap={3}>
      <Grid columns={2} gap={3}>
        <MultiSelect
          size="sm"
          overflow="collapse"
          value={statuses}
          items={STATUSES}
          onValueChange={setStatuses}
        >
          <MultiSelectControl aria-label="Status" placeholder="All statuses" />
          <MultiSelectContent aria-label="Status">
            {STATUSES.map((status) => (
              <MultiSelectItem
                key={status.value}
                value={status.value}
                description={countOf('status', status.value)}
              >
                {status.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
        <MultiSelect
          size="sm"
          overflow="collapse"
          value={channels}
          items={CHANNELS}
          onValueChange={setChannels}
        >
          <MultiSelectControl aria-label="Channel" placeholder="All channels" />
          <MultiSelectContent aria-label="Channel">
            {CHANNELS.map((channel) => (
              <MultiSelectItem
                key={channel.value}
                value={channel.value}
                description={countOf('channel', channel.value)}
              >
                {channel.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Grid>
      <Text size="sm" tone="muted">
        {rows.length} of {ORDERS.length} orders
      </Text>
      <Table columns={5}>
        <TableContent aria-label="Orders">
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader>Status</TableColumnHeader>
              <TableColumnHeader>Channel</TableColumnHeader>
              <TableColumnHeader numeric>Total</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader>{order.id}</TableRowHeader>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{labelOf(STATUSES, order.status)}</TableCell>
                <TableCell>{labelOf(CHANNELS, order.channel)}</TableCell>
                <TableCell numeric>{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
