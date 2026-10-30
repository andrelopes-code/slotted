import { Component } from '@angular/core';
import { SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import {
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tooltip-icon-button',
  imports: [
    SlGlyph,
    SlIconButton,
    SlInline,
    SlText,
    SlTooltip,
    SlTooltipArrow,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  template: `
    <div slInline [gap]="2" align="center">
      <span slText numeric="tabular">UPS 1Z999AA10123456784</span>
      <ng-container slTooltip describes="label">
        <button slIconButton slTooltipTrigger variant="ghost">
          <svg slGlyph name="copy"></svg>
        </button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>Copy tracking number</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slTooltip describes="label">
        <button slIconButton slTooltipTrigger variant="ghost">
          <svg slGlyph name="external"></svg>
        </button>
        <ng-template slTooltipLayer>
          <div slTooltipContent>Open on the UPS site</div>
          <div slTooltipArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class TooltipIconButton {}
