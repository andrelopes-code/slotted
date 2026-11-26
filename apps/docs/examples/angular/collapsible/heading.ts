import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-heading',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger, SlStack],
  template: `
    <div slCollapsible [open]="true" level="2" region variant="framed">
      <h2 slCollapsibleHeader>
        <button slCollapsibleTrigger>Return policy</button>
      </h2>
      <div slCollapsiblePanel>
        <div slStack [gap]="2">
          <div slCollapsible [open]="true" level="3" variant="ruled">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger>Domestic orders</button>
            </h3>
            <div slCollapsiblePanel>Thirty calendar days from delivery.</div>
          </div>

          <div slCollapsible level="3" variant="ruled">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger>International orders</button>
            </h3>
            <div slCollapsiblePanel>Sixty days. The buyer pays return freight.</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CollapsibleHeading {}
