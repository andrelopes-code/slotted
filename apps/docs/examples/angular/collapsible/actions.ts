import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlCollapsible,
  SlCollapsibleActions,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlToolbar } from '@slotted/angular/toolbar';

@Component({
  selector: 'app-collapsible-actions',
  imports: [
    SlButton,
    SlCollapsible,
    SlCollapsibleActions,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
    SlToolbar,
  ],
  template: `
    <div slCollapsible [open]="true" variant="framed">
      <div slCollapsibleHeader>
        <button slCollapsibleTrigger>Free shipping rule</button>
      </div>
      <div slCollapsibleActions>
        <div slToolbar aria-label="Free shipping rule actions" size="sm">
          <button slButton size="sm" variant="ghost">Edit</button>
          <button slButton size="sm" variant="ghost">Duplicate</button>
        </div>
      </div>
      <div slCollapsiblePanel>Free shipping over $250.00 on orders to the contiguous states.</div>
    </div>
  `,
})
export class CollapsibleActionsExample {}
