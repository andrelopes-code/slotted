import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { provideTabsDefaults, SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tabs-defaults',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  providers: [provideTabsDefaults({ size: 'sm', variant: 'contained' })],
  template: `
    <div slStack [gap]="8">
      <div slTabs defaultValue="stock">
        <div slTabList aria-label="Product OAK-90">
          <div slTab value="stock">Stock</div>
          <div slTab value="pricing">Pricing</div>
        </div>
        <div slTabPanel value="stock">
          <span slText size="sm">1,284 units on hand.</span>
        </div>
        <div slTabPanel value="pricing">
          <span slText size="sm">List price $180.00, cost $96.40.</span>
        </div>
      </div>
      <div slTabs defaultValue="open" variant="line">
        <div slTabList aria-label="Purchase orders">
          <div slTab value="open">Open</div>
          <div slTab value="received">Received</div>
        </div>
        <div slTabPanel value="open">
          <span slText size="sm">3 purchase orders for OAK-90 are open.</span>
        </div>
        <div slTabPanel value="received">
          <span slText size="sm">Last received on September 22: 400 units.</span>
        </div>
      </div>
    </div>
  `,
})
export class TabsDefaults {}
