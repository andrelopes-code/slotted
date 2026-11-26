import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';

@Component({
  selector: 'app-collapsible-basic',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger],
  template: `
    <div slCollapsible [open]="true">
      <div slCollapsibleHeader>
        <button slCollapsibleTrigger>Delivery address</button>
      </div>
      <div slCollapsiblePanel>
        Northwind Traders, 402 Maple Street, Seattle, WA 98101. The dock entrance is on the east
        side.
      </div>
    </div>
  `,
})
export class CollapsibleBasic {}
