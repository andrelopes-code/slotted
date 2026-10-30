import { useState } from 'react';
import { Button, IconButton } from '@slotted/react/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@slotted/react/dialog';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';
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
  total: string;
}

const ORDERS: Order[] = [
  { id: 'SO-10482', customer: 'Northwind Traders', total: '$1,240.00' },
  { id: 'SO-10483', customer: 'Contoso Foods', total: '$860.50' },
  { id: 'SO-10484', customer: 'Fabrikam Supply', total: '$2,315.75' },
];

export default function MenuRowActions() {
  const [orders, setOrders] = useState(ORDERS);
  const [pending, setPending] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Table columns={4}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader numeric>Total</TableColumnHeader>
              <TableColumnHeader align="end">Actions</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader>{order.id}</TableRowHeader>
                <TableCell>{order.customer}</TableCell>
                <TableCell numeric>{order.total}</TableCell>
                <TableCell align="end">
                  <Menu align="end">
                    <MenuTrigger
                      render={(props) => (
                        <IconButton {...props} aria-label={`Actions for ${order.id}`} size="sm">
                          <Glyph name="ellipsis" />
                        </IconButton>
                      )}
                    />
                    <MenuContent>
                      <MenuItem>View order</MenuItem>
                      <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        onSelect={() => {
                          setPending(order);
                          setConfirming(true);
                        }}
                        tone="danger"
                      >
                        Delete order…
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
      <AlertDialog onOpenChange={setConfirming} open={confirming}>
        <DialogContent>
          <DialogHeader>
            <AlertDialogIcon />
            <DialogTitle>Delete {pending?.id}?</DialogTitle>
            <DialogDescription>
              The order for {pending?.customer} and its invoice are removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AlertDialogCancel
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  Keep order
                </Button>
              )}
            />
            <AlertDialogAction
              onClick={() => setOrders((rows) => rows.filter((row) => row.id !== pending?.id))}
              render={(props) => (
                <Button {...props} tone="danger">
                  Delete order
                </Button>
              )}
            />
          </DialogFooter>
        </DialogContent>
      </AlertDialog>
    </>
  );
}
