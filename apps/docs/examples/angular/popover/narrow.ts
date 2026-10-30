import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-narrow',
  imports: [
    SlButton,
    SlInline,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
  ],
  template: `
    <div slInline justify="end">
      <ng-container slPopover align="start" size="lg">
        <button slButton tone="secondary" variant="outline" slPopoverTrigger>Volume pricing</button>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Volume pricing for Chai</div>
            </div>
            <div slPopoverBody>
              18.00 USD a case up to 24 cases, 16.20 USD from 25 cases, and 15.30 USD from 100
              cases. Prices apply to orders shipped from the Seattle warehouse.
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class PopoverNarrow {}
