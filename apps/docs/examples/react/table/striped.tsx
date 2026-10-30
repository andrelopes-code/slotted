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

const STOCK = [
  { sku: 'PRD-0412', product: 'Chai', warehouse: 'Reno', onHand: 390, reserved: 42 },
  { sku: 'PRD-0413', product: 'Chang', warehouse: 'Reno', onHand: 170, reserved: 12 },
  { sku: 'PRD-0414', product: 'Aniseed Syrup', warehouse: 'Columbus', onHand: 130, reserved: 70 },
  {
    sku: 'PRD-0415',
    product: "Chef Anton's Cajun Seasoning",
    warehouse: 'Savannah',
    onHand: 530,
    reserved: 0,
  },
  {
    sku: 'PRD-0416',
    product: "Grandma's Boysenberry Spread",
    warehouse: 'Columbus',
    onHand: 120,
    reserved: 25,
  },
  {
    sku: 'PRD-0417',
    product: 'Northwoods Cranberry Sauce',
    warehouse: 'Reno',
    onHand: 60,
    reserved: 60,
  },
];

export default function TableStriped() {
  return (
    <Table columns={5} striped>
      <TableContent aria-label="Stock on hand">
        <TableHead>
          <TableRow>
            <TableColumnHeader>SKU</TableColumnHeader>
            <TableColumnHeader>Product</TableColumnHeader>
            <TableColumnHeader>Warehouse</TableColumnHeader>
            <TableColumnHeader numeric>On hand</TableColumnHeader>
            <TableColumnHeader numeric>Reserved</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {STOCK.map((item) => (
            <TableRow key={item.sku} value={item.sku}>
              <TableRowHeader text="nowrap">{item.sku}</TableRowHeader>
              <TableCell>{item.product}</TableCell>
              <TableCell>{item.warehouse}</TableCell>
              <TableCell numeric>{item.onHand}</TableCell>
              <TableCell numeric>{item.reserved}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
