import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-sizes',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCollapsible [open]="true" size="sm" variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger description="3 of 12 items">Inbound shipments</button>
        </div>
        <div slCollapsiblePanel>Next arrival: pallet PL-4410 at 14:20.</div>
      </div>

      <div slCollapsible [open]="true" size="md" variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger description="8 of 20 items">Outbound shipments</button>
        </div>
        <div slCollapsiblePanel>Next pickup: UPS Ground at 16:30.</div>
      </div>

      <div slCollapsible [open]="true" size="lg" variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger description="5 of 9 zones">Cycle counts</button>
        </div>
        <div slCollapsiblePanel>Zone C closes at 17:00.</div>
      </div>
    </div>
  `,
})
export class CollapsibleSizes {}
