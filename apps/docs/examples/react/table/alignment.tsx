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

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const INVOICES = [
  { id: 'INV-2041', customer: 'Alfreds Futterkiste', region: 'EU', due: 'Oct 4', amount: 1240 },
  {
    id: 'INV-2042',
    customer: 'Great Lakes Food Market',
    region: 'NA',
    due: 'Oct 9',
    amount: 18402.75,
  },
  { id: 'INV-2043', customer: 'Hanari Carnes', region: 'SA', due: 'Oct 12', amount: 86.4 },
];

export default function TableAlignment() {
  return (
    <Table columns={4}>
      <TableContent aria-label="Invoices due">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader align="center">Region</TableColumnHeader>
            <TableColumnHeader align="end">Due</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {INVOICES.map((invoice) => (
            <TableRow key={invoice.id} value={invoice.id}>
              <TableRowHeader>{invoice.customer}</TableRowHeader>
              <TableCell align="center">{invoice.region}</TableCell>
              <TableCell align="end">{invoice.due}</TableCell>
              <TableCell numeric>{USD.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
