import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';
import { Tag } from '@slotted/react/tag';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const TONE = {
  Delivered: 'success',
  'On hold': 'warning',
  Processing: 'accent',
  Shipped: 'secondary',
} as const;

const ORDERS = [
  {
    id: 'SO-10421',
    customer: 'Alfreds Futterkiste',
    warehouse: 'Reno',
    status: 'Shipped',
    total: 1240,
  },
  {
    id: 'SO-10422',
    customer: "Bon app'",
    warehouse: 'Columbus',
    status: 'Processing',
    total: 860.5,
  },
  {
    id: 'SO-10423',
    customer: 'Ernst Handel',
    warehouse: 'Savannah',
    status: 'On hold',
    total: 3410.25,
  },
  {
    id: 'SO-10424',
    customer: 'Folk och fä HB',
    warehouse: 'Reno',
    status: 'Delivered',
    total: 512,
  },
  {
    id: 'SO-10425',
    customer: 'QUICK-Stop',
    warehouse: 'Columbus',
    status: 'Shipped',
    total: 2088.9,
  },
] as const;

export default function TableBasic() {
  return (
    <Table columns={5}>
      <TableContent>
        <TableCaption>Orders placed today</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Warehouse</TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
            <TableColumnHeader numeric>Total</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ORDERS.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader text="nowrap">{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell>{order.warehouse}</TableCell>
              <TableCell>
                <Tag tone={TONE[order.status]}>{order.status}</Tag>
              </TableCell>
              <TableCell numeric>{USD.format(order.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
