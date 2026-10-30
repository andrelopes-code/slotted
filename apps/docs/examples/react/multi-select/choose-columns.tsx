import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import { Stack } from '@slotted/react/stack';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
} from '@slotted/react/table';

type Column = 'order' | 'customer' | 'placed' | 'items' | 'total';

const COLUMNS: (MultiSelectOption & { value: Column })[] = [
  { value: 'order', label: 'Order' },
  { value: 'customer', label: 'Customer' },
  { value: 'placed', label: 'Placed' },
  { value: 'items', label: 'Items' },
  { value: 'total', label: 'Total' },
];

const ORDERS: Record<Column, string>[] = [
  {
    order: 'SO-10482',
    customer: 'Harbor & Pine',
    placed: 'Oct 2',
    items: '14',
    total: '$1,240.00',
  },
  {
    order: 'SO-10483',
    customer: 'Brightline Studio',
    placed: 'Oct 3',
    items: '3',
    total: '$318.50',
  },
  {
    order: 'SO-10484',
    customer: 'Northgate Labs',
    placed: 'Oct 3',
    items: '41',
    total: '$2,906.10',
  },
];

const ALL = COLUMNS.map((column) => column.value);
const labelOf = (value: string) => COLUMNS.find((column) => column.value === value)?.label;

export default function MultiSelectChooseColumns() {
  const [shown, setShown] = useState<readonly string[]>(['order', 'customer', 'total']);
  const columns = shown as readonly Column[];

  return (
    <Stack gap={4}>
      <Field>
        <Inline gap={3} justify="between" align="center">
          <FieldLabel>Columns</FieldLabel>
          <Button
            size="sm"
            tone="secondary"
            variant="ghost"
            disabled={shown.length === ALL.length}
            onClick={() => setShown(ALL)}
          >
            Show all
          </Button>
        </Inline>
        <MultiSelect reorderable value={shown} items={COLUMNS} onValueChange={setShown}>
          <MultiSelectControl placeholder="Add a column" />
          <MultiSelectContent>
            {COLUMNS.map((column) => (
              <MultiSelectItem key={column.value} value={column.value}>
                {column.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
        <FieldDescription>
          The table follows the order of the chips. Alt with an arrow moves a focused column.
        </FieldDescription>
      </Field>
      <Table columns={Math.max(columns.length, 1)}>
        <TableContent aria-label="Orders">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableColumnHeader key={column}>{labelOf(column)}</TableColumnHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ORDERS.map((order) => (
              <TableRow key={order.order} value={order.order}>
                {columns.map((column) => (
                  <TableCell key={column}>{order[column]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
