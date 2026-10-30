import { useMemo, useState } from 'react';
import { createFilterPredicate, type SetFilter } from '@slotted/core/filter';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
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
  TableColumnActions,
  TableColumnHeader,
  TableContent,
  TableFooter,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSelect,
  TableSelectAll,
  TableSetFilter,
  TableSort,
  type TableSortDescriptor,
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
const STATUS_CYCLE = ['Processing', 'Shipped', 'On hold', 'Delivered', 'Processing'];

const ORDERS = Array.from({ length: 20 }, (_, index) => ({
  id: `SO-${10421 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  status: STATUS_CYCLE[index % STATUS_CYCLE.length],
  total: 140 + ((index * 733) % 4100),
}));

type Order = (typeof ORDERS)[number];

const STATUSES = ['Processing', 'On hold', 'Shipped', 'Delivered'].map((value) => ({
  value,
  count: ORDERS.filter((order) => order.status === value).length,
}));

const PAGE_SIZE = 6;

function sortOrders(rows: readonly Order[], sort: TableSortDescriptor | null): readonly Order[] {
  if (sort === null) return rows;
  const key = sort.column as keyof Order;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) =>
    typeof a[key] === 'number'
      ? ((a[key] as number) - (b[key] as number)) * sign
      : String(a[key]).localeCompare(String(b[key])) * sign,
  );
}

export default function TableOrdersList() {
  const [sort, setSort] = useState<TableSortDescriptor | null>({
    column: 'id',
    direction: 'descending',
  });
  const [status, setStatus] = useState<SetFilter | null>(null);
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const [page, setPage] = useState(1);

  const matching = useMemo(() => {
    const keep = createFilterPredicate(status);
    return sortOrders(
      ORDERS.filter((order) => keep(order.status)),
      sort,
    );
  }, [sort, status]);
  const first = (page - 1) * PAGE_SIZE;
  const rows = matching.slice(first, first + PAGE_SIZE);

  return (
    <Table
      columns={5}
      onSortChange={setSort}
      onValueChange={setChosen}
      selectionMode="multiple"
      sort={sort}
      value={chosen}
    >
      <TableContent aria-label="Orders" totalRowCount={matching.length}>
        <TableHead>
          <TableRow>
            <TableSelectAll />
            <TableColumnHeader column="id">
              <TableSort>Order</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="customer">
              <TableSort>Customer</TableSort>
            </TableColumnHeader>
            <TableColumnHeader>
              Status
              <TableColumnActions>
                <TableSetFilter
                  columnLabel="status"
                  onValueChange={(next) => {
                    setStatus(next);
                    setPage(1);
                  }}
                  options={STATUSES}
                  value={status}
                />
              </TableColumnActions>
            </TableColumnHeader>
            <TableColumnHeader column="total" numeric>
              <TableSort>Total</TableSort>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((order, index) => (
            <TableRow key={order.id} rowIndex={first + index + 1} value={order.id}>
              <TableSelect />
              <TableRowHeader text="nowrap">{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell numeric>{USD.format(order.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
      <TableFooter>
        <Inline align="center" gap={3}>
          <Text size="sm" tone="muted">
            {chosen.length} selected
          </Text>
          <Button disabled={chosen.length === 0} size="sm" variant="outline">
            Print packing slips
          </Button>
        </Inline>
        <Pagination count={matching.length} onPageChange={setPage} page={page} pageSize={PAGE_SIZE}>
          <PaginationPrevious />
          <PaginationItems />
          <PaginationNext />
        </Pagination>
      </TableFooter>
    </Table>
  );
}
