import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuTrigger } from '@slotted/react/menu';
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

type Column = 'customer' | 'status' | 'warehouse' | 'total';

const COLUMNS: { key: Column; label: string; numeric?: boolean }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'total', label: 'Total', numeric: true },
];

const ORDERS: (Record<Column, string> & { id: string })[] = [
  {
    id: 'SO-10482',
    customer: 'Northwind Traders',
    status: 'Packed',
    warehouse: 'Rotterdam',
    total: '$1,240.00',
  },
  {
    id: 'SO-10483',
    customer: 'Contoso Foods',
    status: 'Awaiting payment',
    warehouse: 'Leipzig',
    total: '$860.50',
  },
  {
    id: 'SO-10484',
    customer: 'Fabrikam Supply',
    status: 'Shipped',
    warehouse: 'Lyon',
    total: '$2,315.75',
  },
];

export default function MenuColumnVisibility() {
  const [visible, setVisible] = useState<Record<Column, boolean>>({
    customer: true,
    status: true,
    warehouse: false,
    total: true,
  });
  const shown = COLUMNS.filter((column) => visible[column.key]);

  return (
    <Stack align="end" gap={3}>
      <Menu align="end">
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} size="sm" variant="outline">
              Columns
            </Button>
          )}
        />
        <MenuContent>
          <MenuGroup label="Show columns">
            {COLUMNS.map((column) => (
              <MenuCheckboxItem
                checked={visible[column.key]}
                key={column.key}
                onCheckedChange={(checked) =>
                  setVisible((current) => ({ ...current, [column.key]: checked }))
                }
              >
                {column.label}
              </MenuCheckboxItem>
            ))}
          </MenuGroup>
        </MenuContent>
      </Menu>
      <Table columns={shown.length + 1}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              {shown.map((column) => (
                <TableColumnHeader key={column.key} numeric={column.numeric}>
                  {column.label}
                </TableColumnHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ORDERS.map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader>{order.id}</TableRowHeader>
                {shown.map((column) => (
                  <TableCell key={column.key} numeric={column.numeric}>
                    {order[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
