import { Component } from '@angular/core';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const WAREHOUSES = [
  { code: 'RNO', city: 'Reno, NV', open: 42 },
  { code: 'CMH', city: 'Columbus, OH', open: 37 },
  { code: 'SAV', city: 'Savannah, GA', open: 18 },
  { code: 'DFW', city: 'Dallas, TX', open: 51 },
  { code: 'EWR', city: 'Newark, NJ', open: 29 },
  { code: 'ONT', city: 'Ontario, CA', open: 64 },
  { code: 'JOT', city: 'Joliet, IL', open: 23 },
  { code: 'MEM', city: 'Memphis, TN', open: 46 },
  { code: 'ABE', city: 'Allentown, PA', open: 12 },
  { code: 'TIW', city: 'Tacoma, WA', open: 31 },
  { code: 'SCK', city: 'Stockton, CA', open: 9 },
  { code: 'IND', city: 'Indianapolis, IN', open: 27 },
];

@Component({
  selector: 'app-tabs-overflow',
  imports: [SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slTabs defaultValue="MEM">
      <div slTabList aria-label="Warehouses">
        @for (warehouse of warehouses; track warehouse.code) {
          <div slTab [value]="warehouse.code">{{ warehouse.city }}</div>
        }
      </div>
      @for (warehouse of warehouses; track warehouse.code) {
        <div slTabPanel [value]="warehouse.code">
          <span slText size="sm"
            >{{ warehouse.code }}: {{ warehouse.open }} open orders to ship today.</span
          >
        </div>
      }
    </div>
  `,
})
export class TabsOverflow {
  protected readonly warehouses = WAREHOUSES;
}
