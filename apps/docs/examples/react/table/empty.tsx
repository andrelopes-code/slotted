import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import {
  Table,
  TableBody,
  TableColumnHeader,
  TableContent,
  TableEmpty,
  TableHead,
  TableRow,
} from '@slotted/react/table';

export default function TableEmptyExample() {
  return (
    <Table columns={4}>
      <TableContent aria-label="Returns this week">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Return</TableColumnHeader>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader numeric>Refund</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableEmpty>
            <ResultState status="empty">
              <ResultStateContent>
                <ResultStateTitle>No returns this week</ResultStateTitle>
                <ResultStateDescription>
                  Returns appear here as soon as a customer opens one from their order page.
                </ResultStateDescription>
              </ResultStateContent>
            </ResultState>
          </TableEmpty>
        </TableBody>
      </TableContent>
    </Table>
  );
}
