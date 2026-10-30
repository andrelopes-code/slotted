import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';

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

@Component({
  selector: 'app-table-content',
  imports: [
    SlAvatar,
    SlInline,
    SlLink,
    SlStatusIndicator,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slTable [columns]="4">
      <div slTableContent aria-label="Key accounts">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Account</th>
            <th slTableColumnHeader>Account manager</th>
            <th slTableColumnHeader>ERP sync</th>
            <th slTableColumnHeader numeric>Balance</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (account of accounts; track account.id) {
            <tr slTableRow [value]="account.id">
              <th slTableRowHeader text="nowrap">
                <a slLink [href]="'#' + account.id">{{ account.name }}</a>
              </th>
              <td slTableCell text="nowrap">
                <div slInline align="center" [gap]="2">
                  <span slAvatar size="sm" [name]="account.manager"></span>
                  {{ account.manager }}
                </div>
              </td>
              <td slTableCell text="nowrap">
                <span slStatusIndicator [status]="account.sync">{{ account.syncLabel }}</span>
              </td>
              <td slTableCell numeric>{{ usd.format(account.balance) }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableContentExample {
  readonly accounts = ACCOUNTS;
  readonly usd = USD;
}
