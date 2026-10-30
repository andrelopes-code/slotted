import { useMemo, useState } from 'react';
import { createFilterPredicate, type SetFilter } from '@slotted/core/filter';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnActions,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSetFilter,
} from '@slotted/react/table';

const ORDERS = [
  { id: 'SO-10421', customer: 'Alfreds Futterkiste', warehouse: 'Reno', status: 'Shipped' },
  { id: 'SO-10422', customer: "Bon app'", warehouse: 'Columbus', status: 'Processing' },
  { id: 'SO-10423', customer: 'Ernst Handel', warehouse: 'Savannah', status: 'On hold' },
  { id: 'SO-10424', customer: 'Folk och fä HB', warehouse: 'Reno', status: 'Delivered' },
  { id: 'SO-10425', customer: 'QUICK-Stop', warehouse: 'Columbus', status: 'Shipped' },
  { id: 'SO-10426', customer: 'Hanari Carnes', warehouse: 'Savannah', status: 'Processing' },
];

const STATUSES = ['Processing', 'On hold', 'Shipped', 'Delivered'].map((value) => ({
  value,
  count: ORDERS.filter((order) => order.status === value).length,
}));

export default function TableFilter() {
  const [status, setStatus] = useState<SetFilter | null>(null);
  const rows = useMemo(() => {
    const keep = createFilterPredicate(status);
    return ORDERS.filter((order) => keep(order.status));
  }, [status]);

  return (
    <Table columns={4}>
      <TableContent aria-label="Open orders">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Warehouse</TableColumnHeader>
            <TableColumnHeader>
              Status
              <TableColumnActions>
                <TableSetFilter
                  columnLabel="status"
                  onValueChange={setStatus}
                  options={STATUSES}
                  value={status}
                />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader text="nowrap">{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell>{order.warehouse}</TableCell>
              <TableCell>{order.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
