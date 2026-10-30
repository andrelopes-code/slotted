import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableFooter,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSelect,
  TableSelectAll,
} from '@slotted/react/table';
import { Text } from '@slotted/react/typography';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const INVOICES = [
  { id: 'INV-2041', customer: 'Alfreds Futterkiste', status: 'Overdue', amount: 1240 },
  { id: 'INV-2042', customer: 'Great Lakes Food Market', status: 'Overdue', amount: 18402.75 },
  { id: 'INV-2043', customer: 'Hanari Carnes', status: 'Draft', amount: 86.4 },
  { id: 'INV-2044', customer: 'Island Trading', status: 'Sent', amount: 2310 },
  { id: 'INV-2045', customer: 'Lonesome Pine Restaurant', status: 'Sent', amount: 645.2 },
];

export default function TableSelection() {
  const [chosen, setChosen] = useState<readonly string[]>(['INV-2041']);
  const total = INVOICES.filter((invoice) => chosen.includes(invoice.id)).reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );

  return (
    <Table columns={5} onValueChange={setChosen} selectionMode="multiple" value={chosen}>
      <TableContent aria-label="Invoices to send reminders for">
        <TableHead>
          <TableRow>
            <TableSelectAll />
            <TableColumnHeader>Invoice</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {INVOICES.map((invoice) => (
            <TableRow disabled={invoice.status === 'Draft'} key={invoice.id} value={invoice.id}>
              <TableSelect />
              <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell numeric>{USD.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
      <TableFooter>
        <Text size="sm" tone="muted">
          {chosen.length} selected · {USD.format(total)}
        </Text>
      </TableFooter>
    </Table>
  );
}
