import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSort,
  type TableSortDescriptor,
} from '@slotted/react/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const ORDERS = [
  { id: 'SO-10421', customer: 'Alfreds Futterkiste', placed: '2026-09-28', total: 1240 },
  { id: 'SO-10422', customer: "Bon app'", placed: '2026-09-29', total: 860.5 },
  { id: 'SO-10423', customer: 'Ernst Handel', placed: '2026-09-27', total: 3410.25 },
  { id: 'SO-10424', customer: 'Folk och fä HB', placed: '2026-09-30', total: 512 },
];

type Order = (typeof ORDERS)[number];

function sortOrders(rows: readonly Order[], sort: TableSortDescriptor | null): readonly Order[] {
  if (sort === null) return rows;
  const key = sort.column as keyof Order;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) =>
    typeof a[key] === 'number'
      ? ((a[key] as number) - (b[key] as number)) * sign
      : String(a[key]).localeCompare(String(b[key])) * sign,
  );
}

export default function TableSorting() {
  const [sort, setSort] = useState<TableSortDescriptor | null>({
    column: 'placed',
    direction: 'descending',
  });
  const rows = useMemo(() => sortOrders(ORDERS, sort), [sort]);

  return (
    <Table columns={4} onSortChange={setSort} sort={sort}>
      <TableContent aria-label="Recent orders">
        <TableHead>
          <TableRow>
            <TableColumnHeader column="id">
              <TableSort>Order</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="customer">
              <TableSort>Customer</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="placed">
              <TableSort>Placed</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="total" numeric>
              <TableSort>Total</TableSort>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader text="nowrap">{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell text="nowrap">{order.placed}</TableCell>
              <TableCell numeric>{USD.format(order.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
