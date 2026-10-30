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

@Component({
  selector: 'app-popover-arrow-and-offset',
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
      <ng-container slPopover>
        <button slButton tone="secondary" variant="outline" slPopoverTrigger>With arrow</button>
        <ng-template slPopoverLayer>
          <div slPopoverContent aria-label="Pickup window">
            <div slPopoverBody>Speedy Express collects between 3:30 and 4:00 PM.</div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slPopover [arrow]="false" [sideOffset]="8">
        <button slButton tone="secondary" variant="outline" slPopoverTrigger>
          No arrow, 8px further
        </button>
        <ng-template slPopoverLayer>
          <div slPopoverContent aria-label="Pickup window">
            <div slPopoverBody>Speedy Express collects between 3:30 and 4:00 PM.</div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class PopoverArrowAndOffset {}
