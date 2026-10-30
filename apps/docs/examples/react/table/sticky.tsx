import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSummary,
} from '@slotted/react/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const CUSTOMERS = [
  'Alfreds Futterkiste',
  "Bon app'",
  'Ernst Handel',
  'Folk och fä HB',
  'Hanari Carnes',
  'Island Trading',
  'QUICK-Stop',
  'Wartian Herkku',
];
const WAREHOUSES = ['Reno', 'Columbus', 'Savannah'];

const ORDERS = Array.from({ length: 30 }, (_, index) => ({
  id: `SO-${10400 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  warehouse: WAREHOUSES[index % WAREHOUSES.length],
  total: 180 + ((index * 397) % 2400),
}));

const TOTAL = ORDERS.reduce((sum, order) => sum + order.total, 0);

export default function TableSticky() {
  return (
    <Table columns={4} stickyFooter stickyHeader>
      <TableContent
        aria-label="September orders"
        scrollProps={{ style: { maxBlockSize: '20rem' } }}
      >
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Warehouse</TableColumnHeader>
            <TableColumnHeader numeric>Total</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ORDERS.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader text="nowrap">{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell>{order.warehouse}</TableCell>
              <TableCell numeric>{USD.format(order.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableSummary>
          <TableRow>
            <TableCell colSpan={3}>{ORDERS.length} orders</TableCell>
            <TableCell numeric>{USD.format(TOTAL)}</TableCell>
          </TableRow>
        </TableSummary>
      </TableContent>
    </Table>
  );
}
