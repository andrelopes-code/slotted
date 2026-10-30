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
import type { PopoverAlign } from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-alignment',
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
      @for (align of alignments; track align) {
        <ng-container slPopover [align]="align">
          <button slButton tone="secondary" variant="outline" slPopoverTrigger>
            Align {{ align }}
          </button>
          <ng-template slPopoverLayer>
            <div slPopoverContent [attr.aria-label]="'Restock, aligned ' + align">
              <div slPopoverBody>Restock 40 units of Chang from Exotic Liquids by Oct 14.</div>
            </div>
            <div slPopoverArrow></div>
          </ng-template>
        </ng-container>
      }
    </div>
  `,
})
export class PopoverAlignment {
  readonly alignments: PopoverAlign[] = ['start', 'center', 'end'];
}
