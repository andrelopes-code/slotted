import { useState } from 'react';
import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from '@slotted/react/pagination';
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
} from '@slotted/react/table';
import { Text } from '@slotted/react/typography';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const CUSTOMERS = [
  'Alfreds Futterkiste',
  "Bon app'",
  'Ernst Handel',
  'Folk och fä HB',
  'Hanari Carnes',
  'Island Trading',
  'QUICK-Stop',
];

const INVOICES = Array.from({ length: 23 }, (_, index) => ({
  id: `INV-${2041 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  amount: 120 + ((index * 613) % 3900),
}));

const PAGE_SIZE = 5;

export default function TablePagination() {
  const [page, setPage] = useState(1);
  const first = (page - 1) * PAGE_SIZE;
  const rows = INVOICES.slice(first, first + PAGE_SIZE);

  return (
    <Table columns={3}>
      <TableContent aria-label="Invoices" totalRowCount={INVOICES.length}>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Invoice</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((invoice, index) => (
            <TableRow key={invoice.id} rowIndex={first + index + 1} value={invoice.id}>
              <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell numeric>{USD.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
      <TableFooter>
        <Text size="sm" tone="muted">
          {first + 1}–{first + rows.length} of {INVOICES.length}
        </Text>
        <Pagination count={INVOICES.length} onPageChange={setPage} page={page} pageSize={PAGE_SIZE}>
          <PaginationPrevious />
          <PaginationItems />
          <PaginationNext />
        </Pagination>
      </TableFooter>
    </Table>
  );
}
