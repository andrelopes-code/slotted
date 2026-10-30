import { Component, signal } from '@angular/core';
import type { ChangeRequest } from '@slotted/core/state';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tooltip-keyboard',
  imports: [
    SlButton,
    SlInline,
    SlStack,
    SlText,
    SlTooltip,
    SlTooltipArrow,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="3" align="center">
        <ng-container slTooltip (openChangeRequest)="report($event)">
          <button slButton slTooltipTrigger variant="outline">Approve return</button>
          <ng-template slTooltipLayer>
            <div slTooltipContent>Refunds $86.00 to Verde Kitchen and restocks 2 units.</div>
            <div slTooltipArrow></div>
          </ng-template>
        </ng-container>
        <ng-container slTooltip (openChangeRequest)="report($event)">
          <button slButton slTooltipTrigger variant="outline">Reject return</button>
          <ng-template slTooltipLayer>
            <div slTooltipContent>Ships the parcel back to the customer at their cost.</div>
            <div slTooltipArrow></div>
          </ng-template>
        </ng-container>
      </div>
      <span slText size="sm" tone="muted">{{ last() }}</span>
    </div>
  `,
})
export class TooltipKeyboard {
  protected readonly last = signal('Tab to a button, then press Escape or Enter.');

  protected report(request: ChangeRequest<boolean>) {
    this.last.set(`${request.value ? 'Opened' : 'Closed'} by ${request.reason}.`);
  }
}
