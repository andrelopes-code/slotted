import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonStart } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
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
import { SlTab, SlTabEnd, SlTabList, SlTabPanel, SlTabs, SlTabStart } from '@slotted/angular/tabs';
import { SlHeading, SlText } from '@slotted/angular/typography';

const FACTS = [
  ['Customer', 'Harbor & Pine'],
  ['Placed', 'September 8, 2026'],
  ['Payment terms', 'Net 30'],
  ['Ship to', '88 Dock Street, Portland, OR'],
  ['Carrier', 'Atlas Freight'],
  ['Total', '$1,240.00'],
];

const LINES = [
  { sku: 'OAK-90', item: 'Oak shelf, 90 cm', quantity: 4, amount: '$720.00' },
  { sku: 'BRK-ST', item: 'Wall bracket, steel', quantity: 8, amount: '$192.00' },
  { sku: 'KIT-AS', item: 'Assembly kit', quantity: 1, amount: '$328.00' },
];

const ACTIVITY = [
  'Sep 9, 14:02 — Picked at Reno, NV by Luis Ortega',
  'Sep 8, 16:45 — Payment approved',
  'Sep 8, 16:41 — Order placed by Dana Whitfield',
];

@Component({
  selector: 'app-tabs-record-header',
  imports: [
    SlBadge,
    SlButton,
    SlButtonStart,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlGlyph,
    SlHeading,
    SlIcon,
    SlInline,
    SlStack,
    SlTab,
    SlTabEnd,
    SlTabList,
    SlTabPanel,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTabs,
    SlTabStart,
    SlText,
  ],
  template: `
    <div slStack [gap]="6">
      <div slInline [gap]="4" align="start" justify="between" wrap="wrap">
        <div slStack [gap]="1">
          <div slInline [gap]="3" align="center">
            <h2 slHeading size="xl">Order SO-1187</h2>
            <span slBadge tone="warning">Awaiting pickup</span>
          </div>
          <span slText size="sm" tone="muted">Harbor & Pine · Placed September 8, 2026</span>
        </div>
        <div slInline [gap]="2">
          <button slButton size="sm" tone="secondary" variant="outline">
            <span slButtonStart><svg slGlyph name="file-text"></svg></span>
            Packing slip
          </button>
          <button slButton size="sm">Mark shipped</button>
        </div>
      </div>
      <div slTabs defaultValue="overview">
        <div slTabList aria-label="Order SO-1187">
          <div slTab value="overview">
            <span slTabStart
              ><span slIcon><svg slGlyph name="file-text"></svg></span
            ></span>
            Overview
          </div>
          <div slTab value="items">
            <span slTabStart
              ><span slIcon><svg slGlyph name="inbox"></svg></span
            ></span>
            Items
            <span slTabEnd><span slBadge size="sm" [count]="lines.length"></span></span>
          </div>
          <div slTab value="activity">
            <span slTabStart
              ><span slIcon><svg slGlyph name="clock"></svg></span
            ></span>
            Activity
            <span slTabEnd><span slBadge size="sm" [count]="activity.length"></span></span>
          </div>
        </div>
        <div slTabPanel value="overview">
          <div slDescriptionList [columns]="2">
            @for (fact of facts; track fact[0]) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ fact[0] }}</dt>
                <dd slDescriptionListDescription>{{ fact[1] }}</dd>
              </div>
            }
          </div>
        </div>
        <div slTabPanel value="items">
          <div slTable [columns]="4">
            <div slTableContent aria-label="Order lines">
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>SKU</th>
                  <th slTableColumnHeader>Item</th>
                  <th slTableColumnHeader numeric>Quantity</th>
                  <th slTableColumnHeader numeric>Amount</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @for (line of lines; track line.sku) {
                  <tr slTableRow [value]="line.sku">
                    <th slTableRowHeader>{{ line.sku }}</th>
                    <td slTableCell>{{ line.item }}</td>
                    <td slTableCell numeric>{{ line.quantity }}</td>
                    <td slTableCell numeric>{{ line.amount }}</td>
                  </tr>
                }
              </tbody>
            </div>
          </div>
        </div>
        <div slTabPanel value="activity">
          <div slStack [gap]="2">
            @for (entry of activity; track entry) {
              <span slText size="sm">{{ entry }}</span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TabsRecordHeader {
  protected readonly facts = FACTS;
  protected readonly lines = LINES;
  protected readonly activity = ACTIVITY;
}
