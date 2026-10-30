import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const SECTIONS = [
  {
    value: 'general',
    label: 'General',
    lines: ['Code: RNO', 'Address: 1450 Terminal Way, Reno, NV 89502', 'Time zone: Pacific Time'],
  },
  {
    value: 'receiving',
    label: 'Receiving',
    lines: ['Dock hours: 06:00–14:00, Monday to Friday', 'Appointment required for full trucks'],
  },
  {
    value: 'shipping',
    label: 'Shipping',
    lines: ['Carriers: Atlas Freight, Ridgeway Parcel', 'Daily cut-off: 15:30'],
  },
  {
    value: 'storage',
    label: 'Storage',
    lines: ['Zones: A–F, 1,920 bin locations', 'Cycle count: every 30 days'],
  },
];

@Component({
  selector: 'app-tabs-vertical',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slTabs defaultValue="general" orientation="vertical">
      <div slTabList aria-label="Warehouse settings">
        @for (section of sections; track section.value) {
          <div slTab [value]="section.value">{{ section.label }}</div>
        }
      </div>
      @for (section of sections; track section.value) {
        <div slTabPanel [value]="section.value">
          <div slStack [gap]="2">
            @for (line of section.lines; track line) {
              <span slText size="sm">{{ line }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TabsVertical {
  protected readonly sections = SECTIONS;
}
