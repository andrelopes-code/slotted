import { useEffect, useState } from 'react';
import { Button } from '@slotted/react/button';
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

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const PURCHASE_ORDERS = [
  { id: 'PO-7710', supplier: 'Exotic Liquids', expected: 'Oct 3', value: 4120 },
  { id: 'PO-7711', supplier: 'Tokyo Traders', expected: 'Oct 6', value: 2875.5 },
  { id: 'PO-7712', supplier: 'Pavlova, Ltd.', expected: 'Oct 8', value: 9310 },
];

export default function TableRefreshing() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Stack align="start" gap={3}>
      <Button loading={loading} onClick={() => setLoading(true)} size="sm" variant="outline">
        Refresh
      </Button>
      <Table columns={4} loading={loading}>
        <TableContent aria-label="Purchase orders">
          <TableHead>
            <TableRow>
              <TableColumnHeader>Purchase order</TableColumnHeader>
              <TableColumnHeader>Supplier</TableColumnHeader>
              <TableColumnHeader>Expected</TableColumnHeader>
              <TableColumnHeader numeric>Value</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {PURCHASE_ORDERS.map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader text="nowrap">{order.id}</TableRowHeader>
                <TableCell>{order.supplier}</TableCell>
                <TableCell>{order.expected}</TableCell>
                <TableCell numeric>{USD.format(order.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
