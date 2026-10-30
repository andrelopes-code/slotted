import { useState } from 'react';

import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
} from '@slotted/react/drawer';
import { Inline } from '@slotted/react/inline';
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
import { VisuallyHidden } from '@slotted/react/visually-hidden';

const ORDERS = [
  {
    id: 'SO-1182',
    customer: 'Contoso Foods',
    city: 'Seattle, WA',
    status: 'Ready to ship',
    tone: 'accent',
    items: '14 cases, 3 products',
    total: '$1,240.00',
  },
  {
    id: 'SO-1183',
    customer: 'Fabrikam Grocers',
    city: 'Portland, OR',
    status: 'Shipped',
    tone: 'success',
    items: '6 cases, 2 products',
    total: '$386.50',
  },
  {
    id: 'SO-1184',
    customer: 'Tailspin Market',
    city: 'Boise, ID',
    status: 'On hold',
    tone: 'warning',
    items: '22 cases, 5 products',
    total: '$2,075.25',
  },
  {
    id: 'SO-1185',
    customer: 'Adventure Works',
    city: 'Denver, CO',
    status: 'Ready to ship',
    tone: 'accent',
    items: '9 cases, 4 products',
    total: '$918.00',
  },
] as const;

type Order = (typeof ORDERS)[number];

export default function DrawerDetailPanel() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Order>(ORDERS[0]);

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
                    aria-label={`View ${row.id}`}
                    size="sm"
                    tone="secondary"
                    variant="ghost"
                    onClick={() => {
                      setOrder(row);
                      setOpen(true);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
      <Drawer
        modal={false}
        open={open}
        onOpenChange={setOpen}
        outsidePress="none"
        scrimFrom={1}
        size="sm"
      >
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Order {order.id}</DrawerTitle>
            <DrawerDescription>
              {order.customer}, {order.city}
            </DrawerDescription>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <Stack gap={4}>
              <Inline>
                <Badge tone={order.tone}>{order.status}</Badge>
              </Inline>
              <DescriptionList>
                <DescriptionListItem>
                  <DescriptionListTerm>Items</DescriptionListTerm>
                  <DescriptionListDescription>{order.items}</DescriptionListDescription>
                </DescriptionListItem>
                <DescriptionListItem>
                  <DescriptionListTerm>Total</DescriptionListTerm>
                  <DescriptionListDescription>{order.total}</DescriptionListDescription>
                </DescriptionListItem>
              </DescriptionList>
            </Stack>
          </DrawerBody>
        </DrawerPanel>
      </Drawer>
    </>
  );
}
