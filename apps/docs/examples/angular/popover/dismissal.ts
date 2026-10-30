import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
  type PopoverChangeRequest,
} from '@slotted/angular/popover';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-popover-dismissal',
  imports: [
    SlButton,
    SlInline,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverClose,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <ng-container slPopover (openChangeRequest)="record($event)">
        <button slButton tone="secondary" variant="outline" slPopoverTrigger>Delivery note</button>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Order 10249 delivery note</div>
              <button slPopoverClose></button>
            </div>
            <div slPopoverBody>
              Leave at the loading dock behind Toms Spezialitäten. The gate closes at 6:00 PM.
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      <span slText size="sm" tone="muted">Last closed by: {{ reason() }}</span>
    </div>
  `,
})
export class PopoverDismissal {
  readonly reason = signal('not closed yet');

  record(request: PopoverChangeRequest): void {
    if (!request.value) this.reason.set(request.reason);
  }
}
