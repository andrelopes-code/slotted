import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '@slotted/react/menu';
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

interface Order {
  id: string;
  customer: string;
  placed: string;
  total: number;
}

const ORDERS: Order[] = [
  { id: 'SO-10482', customer: 'Northwind Traders', placed: '2026-10-02', total: 1240 },
  { id: 'SO-10483', customer: 'Contoso Foods', placed: '2026-10-03', total: 860.5 },
  { id: 'SO-10484', customer: 'Fabrikam Supply', placed: '2026-10-01', total: 2315.75 },
  { id: 'SO-10485', customer: 'Adventure Works', placed: '2026-10-04', total: 412 },
];

const SORTS: { value: string; label: string; compare: (a: Order, b: Order) => number }[] = [
  { value: 'newest', label: 'Newest first', compare: (a, b) => b.placed.localeCompare(a.placed) },
  { value: 'oldest', label: 'Oldest first', compare: (a, b) => a.placed.localeCompare(b.placed) },
  { value: 'total-desc', label: 'Highest total', compare: (a, b) => b.total - a.total },
  { value: 'total-asc', label: 'Lowest total', compare: (a, b) => a.total - b.total },
  {
    value: 'customer',
    label: 'Customer, A to Z',
    compare: (a, b) => a.customer.localeCompare(b.customer),
  },
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function MenuSortMenu() {
  const [sort, setSort] = useState('newest');
  const current = SORTS.find((option) => option.value === sort) ?? SORTS[0]!;
  const rows = [...ORDERS].sort(current.compare);

  return (
    <Stack align="end" gap={3}>
      <Menu align="end">
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} size="sm" variant="outline">
              Sort: {current.label}
            </Button>
          )}
        />
        <MenuContent>
          <MenuRadioGroup aria-label="Sort orders" onValueChange={setSort} value={sort}>
            {SORTS.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
      <Table columns={4}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader>Placed</TableColumnHeader>
              <TableColumnHeader numeric>Total</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader>{order.id}</TableRowHeader>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.placed}</TableCell>
                <TableCell numeric>{money.format(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
