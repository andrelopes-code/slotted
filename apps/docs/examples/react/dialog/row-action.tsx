import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@slotted/react/dialog';
import { Field, FieldLabel } from '@slotted/react/field';
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
import { TextField } from '@slotted/react/text-field';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

const ORDERS = [
  { id: 'SO-1182', customer: 'Contoso Foods', total: '$1,240.00', amount: '1240.00', card: '4242' },
  { id: 'SO-1183', customer: 'Fabrikam Grocers', total: '$386.50', amount: '386.50', card: '1881' },
  {
    id: 'SO-1184',
    customer: 'Tailspin Market',
    total: '$2,075.25',
    amount: '2075.25',
    card: '0005',
  },
];

type Order = (typeof ORDERS)[number];

export default function DialogRowAction() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Order>(ORDERS[0]!);

  return (
    <>
      <Table columns={4}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader numeric>Total</TableColumnHeader>
              <TableColumnHeader>
                <VisuallyHidden>Actions</VisuallyHidden>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {ORDERS.map((row) => (
              <TableRow key={row.id} value={row.id}>
                <TableRowHeader>{row.id}</TableRowHeader>
                <TableCell>{row.customer}</TableCell>
                <TableCell numeric>{row.total}</TableCell>
                <TableCell>
                  <Button
                    aria-label={`Refund ${row.id}`}
                    size="sm"
                    tone="secondary"
                    variant="ghost"
                    onClick={() => {
                      setOrder(row);
                      setOpen(true);
                    }}
                  >
                    Refund
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
      <Dialog open={open} onOpenChange={setOpen} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund {order.id}</DialogTitle>
            <DialogDescription>
              {order.customer} paid {order.total} with the card ending {order.card}.
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel>Amount in US dollars</FieldLabel>
              <TextField key={order.id} inputMode="decimal" defaultValue={order.amount} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Issue refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
