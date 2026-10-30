import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTab,
  SlTabList,
  SlTabPanel,
  SlTabs,
  type TabsTrack,
  type TabsVariant,
} from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const LOOKS: { variant: TabsVariant; track: TabsTrack }[] = [
  { variant: 'line', track: 'line' },
  { variant: 'contained', track: 'line' },
  { variant: 'line', track: 'none' },
];

const QUEUES = [
  { value: 'incoming', label: 'Incoming', panel: '14 purchase orders due this week.' },
  { value: 'outgoing', label: 'Outgoing', panel: '32 sales orders ready to ship.' },
  { value: 'returns', label: 'Returns', panel: '3 returns awaiting inspection.' },
];

@Component({
  selector: 'app-tabs-variants',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slStack [gap]="8">
      @for (look of looks; track $index) {
        <div slTabs defaultValue="incoming" [track]="look.track" [variant]="look.variant">
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
      }
    </div>
  `,
})
export class TabsVariants {
  protected readonly looks = LOOKS;
  protected readonly queues = QUEUES;
}
