import { Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableDetail,
  TableExpander,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const RETURNS = [
  {
    id: 'RMA-0811',
    order: 'SO-10398',
    customer: 'Ernst Handel',
    refund: 214.5,
    detail:
      'Two cases of Chang arrived crushed. Carrier claim filed with UPS on Sep 24; refund issued to the original card.',
  },
  {
    id: 'RMA-0812',
    order: 'SO-10402',
    customer: 'QUICK-Stop',
    refund: 58,
    detail:
      'Wrong flavour shipped. Replacement sent from Columbus; the returned jar goes back to stock after inspection.',
  },
  {
    id: 'RMA-0813',
    order: 'SO-10407',
    customer: 'Hanari Carnes',
    refund: 1120,
    detail:
      'Order cancelled after dispatch. Pallet returned to Savannah unopened; restocking fee waived by account manager.',
  },
];

export default function TableExpansion() {
  return (
    <Table columns={5} defaultExpanded={['RMA-0811']}>
      <TableContent aria-label="Returns">
        <TableHead>
          <TableRow>
            <TableColumnHeader />
            <TableColumnHeader>Return</TableColumnHeader>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader numeric>Refund</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {RETURNS.map((item) => (
            <Fragment key={item.id}>
              <TableRow value={item.id}>
                <TableCell>
                  <TableExpander />
                </TableCell>
                <TableRowHeader text="nowrap">{item.id}</TableRowHeader>
                <TableCell>{item.order}</TableCell>
                <TableCell>{item.customer}</TableCell>
                <TableCell numeric>{USD.format(item.refund)}</TableCell>
              </TableRow>
              <TableDetail value={item.id}>{item.detail}</TableDetail>
            </Fragment>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
