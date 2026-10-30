import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';

@Component({
  selector: 'app-tooltip-disabled-trigger',
  imports: [
    SlButton,
    SlTooltip,
    SlTooltipArrow,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  template: `
    <ng-container slTooltip>
      <button slButton slTooltipTrigger disabled focusableWhenDisabled>Ship order</button>
      <ng-template slTooltipLayer>
        <div slTooltipContent>2 of 6 lines are still waiting to be picked in Savannah.</div>
        <div slTooltipArrow></div>
      </ng-template>
    </ng-container>
  `,
})
export class TooltipDisabledTrigger {}
