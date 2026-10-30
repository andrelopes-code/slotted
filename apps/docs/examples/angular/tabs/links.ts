import { Component } from '@angular/core';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const VIEWS = [
  { value: 'summary', label: 'Summary', panel: 'Harbor & Pine, $1,240.00, Net 30.' },
  { value: 'items', label: 'Items', panel: '3 lines: shelves, brackets and an assembly kit.' },
  { value: 'shipments', label: 'Shipments', panel: 'Atlas Freight, expected September 12.' },
];

@Component({
  selector: 'app-tabs-links',
  imports: [SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slTabs defaultValue="summary">
      <div slTabList aria-label="Order SO-1187">
        @for (view of views; track view.value) {
          <div slTab [value]="view.value" [href]="'#order-' + view.value">{{ view.label }}</div>
        }
      </div>
      @for (view of views; track view.value) {
        <div slTabPanel [value]="view.value">
          <span slText size="sm">{{ view.panel }}</span>
        </div>
      }
    </div>
  `,
})
export class TabsLinks {
  protected readonly views = VIEWS;
}
