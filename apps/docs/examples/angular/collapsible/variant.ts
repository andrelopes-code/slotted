import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-variant',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCollapsible [open]="true" variant="plain">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Payment terms</button>
        </div>
        <div slCollapsiblePanel>Net 30 from the invoice date.</div>
      </div>

      <div slCollapsible [open]="true" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Shipping terms</button>
        </div>
        <div slCollapsiblePanel>FOB origin. Freight is billed at cost.</div>
      </div>

      <div slCollapsible [open]="true" variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Return terms</button>
        </div>
        <div slCollapsiblePanel>Thirty calendar days, unopened pallets only.</div>
      </div>
    </div>
  `,
})
export class CollapsibleVariant {}
