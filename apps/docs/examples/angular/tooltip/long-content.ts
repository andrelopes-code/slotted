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
  selector: 'app-tooltip-long-content',
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
        <button slButton slTooltipTrigger variant="outline">Carrier exception</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>
            UPS reported an address exception at the Memphis hub on September 29. The parcel is held
            until Atlas Freight confirms a delivery window.
          </div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slTooltip>
        <button slButton slTooltipTrigger variant="outline">Return label</button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>RMA-2291-SO10485-1Z999AA10123456784-ATLASFREIGHT-MEMPHIS</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class TooltipLongContent {}
