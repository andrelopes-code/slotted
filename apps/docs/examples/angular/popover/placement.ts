import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import type { PopoverSide } from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-placement',
  imports: [
    SlButton,
    SlInline,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
  ],
  template: `
    <div slInline [gap]="3" justify="center" wrap="wrap">
      @for (item of sides; track item.side) {
        <ng-container slPopover [side]="item.side">
          <button slButton tone="secondary" variant="outline" slPopoverTrigger>
            {{ item.side }}
          </button>
          <ng-template slPopoverLayer>
            <div slPopoverContent [attr.aria-label]="'Pickup, ' + item.side">
              <div slPopoverBody>{{ item.text }}</div>
            </div>
            <div slPopoverArrow></div>
          </ng-template>
        </ng-container>
      }
    </div>
  `,
})
export class PopoverPlacement {
  readonly sides: { side: PopoverSide; text: string }[] = [
    { side: 'top', text: 'Speedy Express collects at 4:00 PM.' },
    { side: 'bottom', text: 'United Package collects at 5:30 PM.' },
    { side: 'inline-start', text: 'Federal Shipping collects at 11:00 AM.' },
    { side: 'inline-end', text: 'Northwind Courier collects at 2:00 PM.' },
  ];
}
