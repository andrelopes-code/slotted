import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-details',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger, SlStack],
  template: `
    <div slStack [gap]="2">
      <div slCollapsible variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger description="14 orders, $182,400.00">
            Open purchase orders
          </button>
        </div>
        <div slCollapsiblePanel>PO-2201 to PO-2214, all due before March 15.</div>
      </div>

      <div slCollapsible variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger summary="4 scheduled">Carrier pickups</button>
        </div>
        <div slCollapsiblePanel>UPS 16:30, FedEx 17:00, USPS 18:00, DHL 18:30.</div>
      </div>

      <div slCollapsible truncate variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger summary="Updated Mar 4">
            Return conditions for international orders shipped from the Reno warehouse
          </button>
        </div>
        <div slCollapsiblePanel>Sixty days. The buyer pays return freight.</div>
      </div>
    </div>
  `,
})
export class CollapsibleDetails {}
