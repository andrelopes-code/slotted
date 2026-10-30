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
  selector: 'app-tooltip-variants',
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
        <button slButton slTooltipTrigger variant="outline">Reserve 40 units</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>Holds 40 units of NW-4471 in Reno for 48 hours.</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slTooltip variant="surface">
        <button slButton slTooltipTrigger variant="outline">Transfer stock</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>Moves the units from Columbus to Savannah on the next truck.</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class TooltipVariants {}
