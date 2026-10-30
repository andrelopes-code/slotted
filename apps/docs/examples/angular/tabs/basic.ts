import { Component } from '@angular/core';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const SECTIONS = [
  {
    value: 'summary',
    label: 'Summary',
    pairs: [
      ['Customer', 'Harbor & Pine'],
      ['Placed', 'September 8, 2026'],
      ['Payment terms', 'Net 30'],
      ['Total', '$1,240.00'],
    ],
  },
  {
    value: 'items',
    label: 'Items',
    pairs: [
      ['Oak shelf, 90 cm', '4 × $180.00'],
      ['Wall bracket, steel', '8 × $24.00'],
      ['Assembly kit', '1 × $328.00'],
    ],
  },
  {
    value: 'shipments',
    label: 'Shipments',
    pairs: [
      ['Carrier', 'Atlas Freight'],
      ['Tracking', 'AF-2210-4471'],
      ['Expected', 'September 12, 2026'],
    ],
  },
];

const ACTIVITY = [
  'Sep 9, 14:02 — Picked at Reno, NV',
  'Sep 8, 16:45 — Payment approved',
  'Sep 8, 16:41 — Order placed by Dana Whitfield',
];

@Component({
  selector: 'app-tabs-basic',
  imports: [
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlStack,
    SlTab,
    SlTabList,
    SlTabPanel,
    SlTabs,
    SlText,
  ],
  template: `
    <div slTabs defaultValue="summary">
      <div slTabList aria-label="Order SO-1187">
        @for (section of sections; track section.value) {
          <div slTab [value]="section.value">{{ section.label }}</div>
        }
        <div slTab value="activity">Activity</div>
      </div>
      @for (section of sections; track section.value) {
        <div slTabPanel [value]="section.value">
          <div slDescriptionList>
            @for (pair of section.pairs; track pair[0]) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ pair[0] }}</dt>
                <dd slDescriptionListDescription>{{ pair[1] }}</dd>
              </div>
            }
          </div>
        </div>
      }
      <div slTabPanel value="activity">
        <div slStack [gap]="2">
          @for (entry of activity; track entry) {
            <span slText size="sm">{{ entry }}</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class TabsBasic {
  protected readonly sections = SECTIONS;
  protected readonly activity = ACTIVITY;
}
