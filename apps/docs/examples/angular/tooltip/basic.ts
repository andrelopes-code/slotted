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
  selector: 'app-tooltip-basic',
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
      <button slButton slTooltipTrigger variant="outline">Sync inventory</button>
      <ng-template slTooltipLayer>
        <div slTooltipContent>Pulls stock levels from Reno, Columbus and Savannah.</div>
        <div slTooltipArrow></div>
      </ng-template>
    </ng-container>
  `,
})
export class TooltipBasic {}
