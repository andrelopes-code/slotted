import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  providePopoverDefaults,
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-defaults',
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
  providers: [providePopoverDefaults({ arrow: false, size: 'sm' })],
  template: `
    <div slInline [gap]="3" justify="center" wrap="wrap">
      @for (term of terms; track term.label) {
        <ng-container slPopover>
          <button slButton tone="secondary" variant="outline" slPopoverTrigger>
            {{ term.label }}
          </button>
          <ng-template slPopoverLayer>
            <div slPopoverContent [attr.aria-label]="term.label">
              <div slPopoverBody>{{ term.text }}</div>
            </div>
            <div slPopoverArrow></div>
          </ng-template>
        </ng-container>
      }
      <ng-container slPopover [arrow]="true">
        <button slButton tone="secondary" variant="outline" slPopoverTrigger>
          Cash in advance
        </button>
        <ng-template slPopoverLayer>
          <div slPopoverContent aria-label="Cash in advance">
            <div slPopoverBody>The order ships once the payment has cleared.</div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class PopoverDefaults {
  readonly terms = [
    { label: 'Net 30', text: 'Payment is due 30 days after the invoice date.' },
    { label: 'Net 60', text: 'Payment is due 60 days after the invoice date.' },
  ];
}
