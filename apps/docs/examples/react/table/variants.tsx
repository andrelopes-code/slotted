import { Stack } from '@slotted/react/stack';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';

const SHIPMENTS = [
  { id: 'SH-3301', carrier: 'UPS Ground', cartons: 12 },
  { id: 'SH-3302', carrier: 'FedEx Express', cartons: 3 },
  { id: 'SH-3303', carrier: 'USPS Priority', cartons: 1 },
];

const VARIANTS = [
  { variant: 'plain', caption: 'Plain: inside a card that already draws the box' },
  { variant: 'ruled', caption: 'Ruled: the default, a rule between rows' },
  { variant: 'framed', caption: 'Framed: the table is its own panel' },
] as const;

export default function TableVariants() {
  return (
    <Stack gap={6}>
      {VARIANTS.map(({ variant, caption }) => (
        <Table columns={3} key={variant} variant={variant}>
          <TableContent>
            <TableCaption>{caption}</TableCaption>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Shipment</TableColumnHeader>
                <TableColumnHeader>Carrier</TableColumnHeader>
                <TableColumnHeader numeric>Cartons</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {SHIPMENTS.map((shipment) => (
                <TableRow key={shipment.id} value={shipment.id}>
                  <TableRowHeader>{shipment.id}</TableRowHeader>
                  <TableCell>{shipment.carrier}</TableCell>
                  <TableCell numeric>{shipment.cartons}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContent>
        </Table>
      ))}
    </Stack>
  );
}
