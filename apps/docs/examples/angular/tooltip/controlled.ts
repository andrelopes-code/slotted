import { Component, signal } from '@angular/core';
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
  selector: 'app-tooltip-controlled',
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
        <ng-container slTooltip [(open)]="open">
          <button slButton slTooltipTrigger variant="outline">Same-day dispatch</button>
          <ng-template slTooltipLayer>
            <div slTooltipContent>
              Orders placed before 2:00 PM Pacific leave Reno the same day.
            </div>
            <div slTooltipArrow></div>
          </ng-template>
        </ng-container>
        <button slButton variant="ghost" (click)="open.set(true)">Show the cutoff</button>
      </div>
      <span slText size="sm" tone="muted">
        {{ open() ? 'The cutoff hint is open.' : 'The cutoff hint is closed.' }}
      </span>
    </div>
  `,
})
export class TooltipControlled {
  protected readonly open = signal(false);
}
