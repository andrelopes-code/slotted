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

const SHIPMENTS = [
  {
    id: 'SH-3301',
    order: 'SO-10421',
    customer: 'Alfreds Futterkiste',
    origin: 'Reno, NV',
    destination: 'Berlin, DE',
    carrier: 'UPS Worldwide',
    shipped: 'Sep 28, 2026',
    cost: 412.8,
  },
  {
    id: 'SH-3302',
    order: 'SO-10422',
    customer: "Bon app'",
    origin: 'Columbus, OH',
    destination: 'Marseille, FR',
    carrier: 'FedEx International',
    shipped: 'Sep 29, 2026',
    cost: 288.15,
  },
  {
    id: 'SH-3303',
    order: 'SO-10423',
    customer: 'Ernst Handel',
    origin: 'Savannah, GA',
    destination: 'Graz, AT',
    carrier: 'DHL Express',
    shipped: 'Sep 29, 2026',
    cost: 506.4,
  },
  {
    id: 'SH-3304',
    order: 'SO-10425',
    customer: 'QUICK-Stop',
    origin: 'Columbus, OH',
    destination: 'Cunewalde, DE',
    carrier: 'UPS Worldwide',
    shipped: 'Sep 30, 2026',
    cost: 347.9,
  },
];

export default function TableScroll() {
  return (
    <Table columns={8}>
      <TableContent aria-label="International shipments">
        <TableHead>
          <TableRow>
            <TableColumnHeader sticky="start" text="nowrap">
              Shipment
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">Order</TableColumnHeader>
            <TableColumnHeader text="nowrap">Customer</TableColumnHeader>
            <TableColumnHeader text="nowrap">Origin</TableColumnHeader>
            <TableColumnHeader text="nowrap">Destination</TableColumnHeader>
            <TableColumnHeader text="nowrap">Carrier</TableColumnHeader>
            <TableColumnHeader text="nowrap">Shipped</TableColumnHeader>
            <TableColumnHeader numeric text="nowrap">
              Cost
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {SHIPMENTS.map((shipment) => (
            <TableRow key={shipment.id} value={shipment.id}>
              <TableRowHeader sticky="start" text="nowrap">
                {shipment.id}
              </TableRowHeader>
              <TableCell text="nowrap">{shipment.order}</TableCell>
              <TableCell text="nowrap">{shipment.customer}</TableCell>
              <TableCell text="nowrap">{shipment.origin}</TableCell>
              <TableCell text="nowrap">{shipment.destination}</TableCell>
              <TableCell text="nowrap">{shipment.carrier}</TableCell>
              <TableCell text="nowrap">{shipment.shipped}</TableCell>
              <TableCell numeric>{USD.format(shipment.cost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
