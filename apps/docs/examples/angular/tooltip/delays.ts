import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';

@Component({
  selector: 'app-tooltip-delays',
  imports: [
    SlButton,
    SlInline,
    SlTooltip,
    SlTooltipArrow,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  template: `
    <div slInline [gap]="3" align="center">
      <ng-container slTooltip>
        <button slButton slTooltipTrigger variant="outline">Release hold</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>Returns SO-10483 to the pick queue in Reno.</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slTooltip [openDelay]="1200" [closeDelay]="400">
        <button slButton slTooltipTrigger variant="outline" tone="danger">Cancel order</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>Refunds $318.50 to Brightline Studio and restocks 3 lines.</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slTooltip [openDelay]="200">
        <button slButton slTooltipTrigger variant="outline">Track parcel</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>UPS · out for delivery in Portland, OR.</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class TooltipDelays {}
