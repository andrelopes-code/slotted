import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
  type TooltipAlign,
  type TooltipSide,
} from '@slotted/angular/tooltip';

const ACTIONS: { label: string; hint: string; side: TooltipSide; align: TooltipAlign }[] = [
  {
    label: 'Print label',
    hint: 'Prints a 4 × 6 label at packing station 3.',
    side: 'top',
    align: 'center',
  },
  {
    label: 'Weigh parcel',
    hint: 'Reads the scale under station 3.',
    side: 'bottom',
    align: 'center',
  },
  {
    label: 'Previous order',
    hint: 'SO-10484 · Northgate Labs',
    side: 'inline-start',
    align: 'center',
  },
  { label: 'Next order', hint: 'SO-10486 · Quill & Co.', side: 'inline-end', align: 'start' },
];

@Component({
  selector: 'app-tooltip-placement',
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
      @for (action of actions; track action.label) {
        <ng-container slTooltip [side]="action.side" [align]="action.align">
          <button slButton slTooltipTrigger variant="outline">{{ action.label }}</button>
          <ng-template slTooltipLayer>
            <div slTooltipContent>{{ action.hint }}</div>
            <div slTooltipArrow></div>
          </ng-template>
        </ng-container>
      }
    </div>
  `,
})
export class TooltipPlacement {
  protected readonly actions = ACTIONS;
}
