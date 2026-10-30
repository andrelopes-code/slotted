import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tabs-disabled',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slStack [gap]="8">
      <div slTabs defaultValue="summary">
        <div slTabList aria-label="Order SO-1192">
          <div slTab value="summary">Summary</div>
          <div slTab value="items">Items</div>
          <div slTab value="invoice" disabled>Invoice</div>
        </div>
        <div slTabPanel value="summary">
          <span slText size="sm">Awaiting pickup. The invoice is issued once the order ships.</span>
        </div>
        <div slTabPanel value="items">
          <span slText size="sm">5 items from the Reno, NV warehouse.</span>
        </div>
        <div slTabPanel value="invoice">
          <span slText size="sm">Invoice INV-20931.</span>
        </div>
      </div>
      <div slTabs defaultValue="summary" disabled>
        <div slTabList aria-label="Order SO-1188">
          <div slTab value="summary">Summary</div>
          <div slTab value="items">Items</div>
          <div slTab value="invoice">Invoice</div>
        </div>
        <div slTabPanel value="summary">
          <span slText size="sm">Locked while the warehouse recounts this order.</span>
        </div>
        <div slTabPanel value="items">
          <span slText size="sm">2 items from the Columbus, OH warehouse.</span>
        </div>
        <div slTabPanel value="invoice">
          <span slText size="sm">Invoice INV-20917.</span>
        </div>
      </div>
    </div>
  `,
})
export class TabsDisabled {}
