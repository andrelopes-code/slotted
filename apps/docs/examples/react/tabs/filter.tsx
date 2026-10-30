import { useId, useState } from 'react';
import { Badge } from '@slotted/react/badge';
import { Stack } from '@slotted/react/stack';
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
import { Tab, TabList, Tabs } from '@slotted/react/tabs';

const ORDERS = [
  { id: 'SO-1187', customer: 'Harbor & Pine', status: 'open', total: '$1,240.00' },
  { id: 'SO-1188', customer: 'Brightline Studio', status: 'shipped', total: '$318.50' },
  { id: 'SO-1190', customer: 'Northgate Labs', status: 'open', total: '$2,906.10' },
  { id: 'SO-1191', customer: 'Verde Kitchen', status: 'delayed', total: '$86.00' },
  { id: 'SO-1193', customer: 'Quill & Co.', status: 'shipped', total: '$540.25' },
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'shipped', label: 'Shipped' },
];

const STATUS: Record<string, string> = { open: 'Open', delayed: 'Delayed', shipped: 'Shipped' };

const matching = (filter: string) =>
  filter === 'all' ? ORDERS : ORDERS.filter((order) => order.status === filter);

export default function TabsFilter() {
  const tableId = useId();
  const [filter, setFilter] = useState('all');

  return (
    <Stack gap={4}>
      <Tabs size="sm" value={filter} onValueChange={setFilter}>
        <TabList aria-label="Orders by status">
          {FILTERS.map((item) => (
            <Tab
              key={item.value}
              controls={tableId}
              end={<Badge count={matching(item.value).length} showZero size="sm" />}
              value={item.value}
            >
              {item.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <Table columns={4} id={tableId}>
        <TableContent aria-label="Orders">
          <TableHead>
            <TableRow>
              <TableColumnHeader>Order</TableColumnHeader>
              <TableColumnHeader>Customer</TableColumnHeader>
              <TableColumnHeader>Status</TableColumnHeader>
              <TableColumnHeader numeric>Total</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {matching(filter).map((order) => (
              <TableRow key={order.id} value={order.id}>
                <TableRowHeader>{order.id}</TableRowHeader>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{STATUS[order.status]}</TableCell>
                <TableCell numeric>{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    </Stack>
  );
}
