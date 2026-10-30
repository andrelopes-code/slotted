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

const NOTES = [
  {
    id: 'SO-10421',
    note: 'Leave at the loading dock behind the warehouse; the front office closes at noon on Fridays.',
    tracking: '1Z999AA10123456784',
  },
  {
    id: 'SO-10422',
    note: 'Customer asked for the invoice to be emailed to accounts payable rather than printed.',
    tracking: '1Z999AA10123456785',
  },
];

export default function TableText() {
  return (
    <Table columns={3} layout="fixed">
      <TableContent aria-label="Delivery notes">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Note</TableColumnHeader>
            <TableColumnHeader>Tracking</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {NOTES.map((row) => (
            <TableRow key={row.id} value={row.id}>
              <TableRowHeader text="nowrap">{row.id}</TableRowHeader>
              <TableCell text="truncate">{row.note}</TableCell>
              <TableCell text="wrap">{row.tracking}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
