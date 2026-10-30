import { useState } from 'react';

import { Badge } from '@slotted/react/badge';
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
  DialogTrigger,
} from '@slotted/react/dialog';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
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
  TableSelect,
  TableSelectAll,
} from '@slotted/react/table';
import { Text } from '@slotted/react/typography';

const STATUSES = [
  { value: 'processing', label: 'Processing', tone: 'accent' },
  { value: 'hold', label: 'On hold', tone: 'warning' },
  { value: 'ready', label: 'Ready to ship', tone: 'success' },
] as const;

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

type Status = (typeof STATUSES)[number]['value'];

const INITIAL: { id: string; customer: string; status: Status; warehouse: string }[] = [
  { id: 'SO-1182', customer: 'Contoso Foods', status: 'processing', warehouse: 'RNO' },
  { id: 'SO-1183', customer: 'Fabrikam Grocers', status: 'processing', warehouse: 'CMH' },
  { id: 'SO-1184', customer: 'Tailspin Market', status: 'hold', warehouse: 'RNO' },
  { id: 'SO-1185', customer: 'Woodgrove Deli', status: 'processing', warehouse: 'SAV' },
];

const statusOf = (value: Status) => STATUSES.find((status) => status.value === value)!;
const warehouseOf = (value: string) => WAREHOUSES.find((option) => option.value === value)?.label;

export default function DialogBulkEdit() {
  const [orders, setOrders] = useState(INITIAL);
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const [editing, setEditing] = useState<readonly string[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('ready');
  const [warehouse, setWarehouse] = useState('RNO');
  const count = chosen.length;
  const noun = editing.length === 1 ? 'order' : 'orders';

  const apply = () => {
    setOrders((rows) =>
      rows.map((row) => (editing.includes(row.id) ? { ...row, status, warehouse } : row)),
    );
    setChosen([]);
    setOpen(false);
  };

  return (
    <Stack gap={3}>
      <Inline align="center" gap={3}>
        <Text size="sm" tone="muted">
          {count === 0 ? 'Select orders to edit them together.' : `${count} selected`}
        </Text>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) setEditing(chosen);
            setOpen(next);
          }}
        >
          <DialogTrigger
            render={(props) => (
              <Button
                {...props}
                disabled={count === 0}
                focusableWhenDisabled
                size="sm"
                tone="secondary"
                variant="outline"
              >
                Edit selected
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit {editing.length} {noun}
              </DialogTitle>
              <DialogDescription>{editing.join(', ')}</DialogDescription>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Stack gap={4}>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    items={[...STATUSES]}
                    value={status}
                    onValueChange={(next) => {
                      if (typeof next === 'string') setStatus(next as Status);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Ships from</FieldLabel>
                  <Select
                    items={WAREHOUSES}
                    value={warehouse}
                    onValueChange={(next) => {
                      if (typeof next === 'string') setWarehouse(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WAREHOUSES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={apply}>
                Update {editing.length} {noun}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Inline>
      <Table columns={5} selectionMode="multiple" value={chosen} onValueChange={setChosen}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableSelectAll />
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader>Status</TableColumnHeader>
              <TableColumnHeader>Ships from</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((row) => (
              <TableRow key={row.id} value={row.id}>
                <TableSelect />
                <TableRowHeader>{row.id}</TableRowHeader>
                <TableCell>{row.customer}</TableCell>
                <TableCell>
                  <Badge tone={statusOf(row.status).tone}>{statusOf(row.status).label}</Badge>
                </TableCell>
                <TableCell>{warehouseOf(row.warehouse)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
