import { Component } from '@angular/core';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const QUEUES = [
  { value: 'incoming', label: 'Incoming', panel: '14 purchase orders due this week.' },
  { value: 'outgoing', label: 'Outgoing', panel: '32 sales orders ready to ship.' },
  {
    value: 'inspection',
    label: 'Awaiting inspection',
    panel: '3 returns wait for a quality check before restocking.',
  },
];

@Component({
  selector: 'app-tabs-fit',
  imports: [SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slTabs defaultValue="incoming" fit="equal" variant="contained">
      <div slTabList aria-label="Warehouse queues">
        @for (queue of queues; track queue.value) {
          <div slTab [value]="queue.value">{{ queue.label }}</div>
        }
      </div>
      @for (queue of queues; track queue.value) {
        <div slTabPanel [value]="queue.value">
          <span slText size="sm">{{ queue.panel }}</span>
        </div>
      }
    </div>
  `,
})
export class TabsFit {
  protected readonly queues = QUEUES;
}
