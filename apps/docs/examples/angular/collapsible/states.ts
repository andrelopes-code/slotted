import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-states',
  imports: [
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
    SlSkeletonText,
    SlStack,
  ],
  template: `
    <div slStack [gap]="4">
      <div slCollapsible [open]="true" disabled variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger description="Read only">Archived carriers</button>
        </div>
        <div slCollapsiblePanel>Contracts with these carriers closed on December 31.</div>
      </div>

      <div slCollapsible [open]="true" loading variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Delivery history</button>
        </div>
        <div slCollapsiblePanel>
          <div slSkeletonText [lines]="3"></div>
        </div>
      </div>
    </div>
  `,
})
export class CollapsibleStates {}
