import { useState } from 'react';
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
} from '@slotted/react/table';

const RATES = [
  { id: 'ups-ground', carrier: 'UPS Ground', days: '3–5 days', price: '$18.40' },
  { id: 'fedex-2day', carrier: 'FedEx 2Day', days: '2 days', price: '$31.15' },
  { id: 'usps-priority', carrier: 'USPS Priority', days: '1–3 days', price: '$24.90' },
];

export default function TableSingleSelection() {
  const [rate, setRate] = useState<readonly string[]>(['ups-ground']);

  return (
    <Table columns={4} onValueChange={setRate} selectionMode="single" value={rate}>
      <TableContent aria-label="Shipping rates for SO-10423">
        <TableHead>
          <TableRow>
            <TableColumnHeader />
            <TableColumnHeader>Carrier</TableColumnHeader>
            <TableColumnHeader>Transit</TableColumnHeader>
            <TableColumnHeader numeric>Price</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {RATES.map((option) => (
            <TableRow key={option.id} value={option.id}>
              <TableSelect />
              <TableRowHeader>{option.carrier}</TableRowHeader>
              <TableCell>{option.days}</TableCell>
              <TableCell numeric>{option.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
