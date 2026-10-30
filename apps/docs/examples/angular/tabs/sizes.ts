import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs, type TabsSize } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const SIZES: TabsSize[] = ['sm', 'md', 'lg'];

const VIEWS = [
  { value: 'stock', label: 'Stock', panel: '1,284 units on hand across 3 warehouses.' },
  { value: 'movements', label: 'Movements', panel: '46 movements in the last 7 days.' },
  {
    value: 'suppliers',
    label: 'Suppliers',
    panel: 'Ordered from Brightline Studio and Quill & Co.',
  },
];

@Component({
  selector: 'app-tabs-sizes',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slStack [gap]="8">
      @for (size of sizes; track size) {
        <div slTabs defaultValue="stock" [size]="size">
          <div slTabList aria-label="Product OAK-90">
            @for (view of views; track view.value) {
              <div slTab [value]="view.value">{{ view.label }}</div>
            }
          </div>
          @for (view of views; track view.value) {
            <div slTabPanel [value]="view.value">
              <span slText size="sm">{{ view.panel }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TabsSizes {
  protected readonly sizes = SIZES;
  protected readonly views = VIEWS;
}
