import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
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
import { VisuallyHidden } from '@slotted/react/visually-hidden';

const ORDERS = [
  { id: 'SO-10421', total: '$1,240.00' },
  { id: 'SO-10422', total: '$860.50' },
  { id: 'SO-10423', total: '$3,410.25' },
] as const;

export default function VisuallyHiddenTableHeading() {
  return (
    <Table columns={3}>
      <TableContent>
        <TableCaption>Orders placed today</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader numeric>Total</TableColumnHeader>
            <TableColumnHeader>
              <VisuallyHidden>Actions</VisuallyHidden>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ORDERS.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader>{order.id}</TableRowHeader>
              <TableCell numeric>{order.total}</TableCell>
              <TableCell>
                <Button tone="danger" variant="ghost">
                  <Glyph name="trash" />
                  <VisuallyHidden>Cancel order {order.id}</VisuallyHidden>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
