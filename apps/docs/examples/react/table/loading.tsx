import {
  Table,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableLoader,
  TableRow,
} from '@slotted/react/table';

export default function TableLoading() {
  return (
    <Table columns={4}>
      <TableContent aria-label="Purchase orders">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Purchase order</TableColumnHeader>
            <TableColumnHeader>Supplier</TableColumnHeader>
            <TableColumnHeader>Expected</TableColumnHeader>
            <TableColumnHeader numeric>Value</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableLoader skeletonRows={4} />
      </TableContent>
    </Table>
  );
}
