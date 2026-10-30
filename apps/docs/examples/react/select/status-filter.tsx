import { useState } from 'react';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
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
const OPTIONS = [ALL, ...STATUSES];

const labelOf = (status: string) => STATUSES.find((option) => option.value === status)?.label;

export default function SelectStatusFilter() {
  const [status, setStatus] = useState('all');
  const rows = status === 'all' ? ORDERS : ORDERS.filter((order) => order.status === status);

  return (
    <Stack gap={3}>
      <Inline gap={3} justify="between" align="center">
        <Text size="sm" tone="muted">
          {rows.length} of {ORDERS.length} orders
        </Text>
        <Select
          size="sm"
          align="end"
          fullWidth={false}
          value={status}
          items={OPTIONS}
          onValueChange={(next) => setStatus(typeof next === 'string' ? next : 'all')}
        >
          <SelectTrigger aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL.value}>{ALL.label}</SelectItem>
            <SelectSeparator />
            {STATUSES.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                icon={
                  <Icon>
                    <Glyph name={option.icon} />
                  </Icon>
                }
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Inline>
      <Table columns={4}>
        <TableContent aria-label="Orders">
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader>Status</TableColumnHeader>
              <TableColumnHeader numeric>Total</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader>{order.id}</TableRowHeader>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{labelOf(order.status)}</TableCell>
                <TableCell numeric>{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
