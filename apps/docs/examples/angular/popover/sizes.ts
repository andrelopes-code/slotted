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
import type { PopoverSize } from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-sizes',
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
    <div slInline [gap]="3" justify="center" wrap="wrap">
      @for (size of sizes; track size) {
        <ng-container slPopover [size]="size">
          <button slButton tone="secondary" variant="outline" slPopoverTrigger>{{ size }}</button>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverHeader>
                <div slPopoverTitle>Order 10248</div>
              </div>
              <div slPopoverBody>
                Vins et alcools Chevalier, Reims. Three lines, 440.00 USD, shipped by Federal
                Shipping on Jul 16.
              </div>
            </div>
            <div slPopoverArrow></div>
          </ng-template>
        </ng-container>
      }
    </div>
  `,
})
export class PopoverSizes {
  readonly sizes: PopoverSize[] = ['sm', 'md', 'lg'];
}
