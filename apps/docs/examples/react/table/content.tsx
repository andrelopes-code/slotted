import { Avatar } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';
import { Link } from '@slotted/react/link';
import { StatusIndicator } from '@slotted/react/status-indicator';
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

const ACCOUNTS = [
  {
    id: 'ALFKI',
    name: 'Alfreds Futterkiste',
    manager: 'Nancy Davolio',
    sync: 'success',
    syncLabel: 'In sync',
    balance: 1240,
  },
  {
    id: 'ERNSH',
    name: 'Ernst Handel',
    manager: 'Andrew Fuller',
    sync: 'warning',
    syncLabel: 'Delayed',
    balance: 3410.25,
  },
  {
    id: 'QUICK',
    name: 'QUICK-Stop',
    manager: 'Janet Leverling',
    sync: 'danger',
    syncLabel: 'Failed',
    balance: 2088.9,
  },
] as const;

export default function TableContentExample() {
  return (
    <Table columns={4}>
      <TableContent aria-label="Key accounts">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Account</TableColumnHeader>
            <TableColumnHeader>Account manager</TableColumnHeader>
            <TableColumnHeader>ERP sync</TableColumnHeader>
            <TableColumnHeader numeric>Balance</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ACCOUNTS.map((account) => (
            <TableRow key={account.id} value={account.id}>
              <TableRowHeader text="nowrap">
                <Link href={`#${account.id}`}>{account.name}</Link>
              </TableRowHeader>
              <TableCell text="nowrap">
                <Inline align="center" gap={2}>
                  <Avatar name={account.manager} size="sm" />
                  {account.manager}
                </Inline>
              </TableCell>
              <TableCell text="nowrap">
                <StatusIndicator status={account.sync}>{account.syncLabel}</StatusIndicator>
              </TableCell>
              <TableCell numeric>{USD.format(account.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
