import { Component } from '@angular/core';
import { SlIconButton } from '@slotted/angular/button';
import { SlGlyph, type GlyphName } from '@slotted/angular/icon';
import { SlToolbar, SlToolbarSeparator } from '@slotted/angular/toolbar';
import {
  provideTooltipDefaults,
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';

interface Action {
  icon: GlyphName;
  label: string;
}

const DOCUMENTS: Action[] = [
  { icon: 'copy', label: 'Copy order number' },
  { icon: 'file-text', label: 'Print packing slip' },
  { icon: 'paperclip', label: 'Attach invoice' },
];

const TRACKING: Action[] = [
  { icon: 'bell', label: 'Notify me on delivery' },
  { icon: 'pin', label: 'Pin to overview' },
  { icon: 'external', label: 'Open on the UPS site' },
];

@Component({
  selector: 'app-tooltip-toolbar',
  imports: [
    SlGlyph,
    SlIconButton,
    SlToolbar,
    SlToolbarSeparator,
    SlTooltip,
    SlTooltipArrow,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  providers: [provideTooltipDefaults({ describes: 'label', size: 'sm' })],
  template: `
    <div slToolbar aria-label="Order SO-10485">
      @for (action of documents; track action.label) {
        <ng-container slTooltip>
          <button slIconButton slTooltipTrigger size="sm" variant="ghost">
            <svg slGlyph [name]="action.icon"></svg>
          </button>
          <ng-template slTooltipLayer>
            <div slTooltipContent>{{ action.label }}</div>
            <div slTooltipArrow></div>
          </ng-template>
        </ng-container>
      }
      <div slToolbarSeparator></div>
      @for (action of tracking; track action.label) {
        <ng-container slTooltip>
          <button slIconButton slTooltipTrigger size="sm" variant="ghost">
            <svg slGlyph [name]="action.icon"></svg>
          </button>
          <ng-template slTooltipLayer>
            <div slTooltipContent>{{ action.label }}</div>
            <div slTooltipArrow></div>
          </ng-template>
        </ng-container>
      }
    </div>
  `,
})
export class TooltipToolbar {
  protected readonly documents = DOCUMENTS;
  protected readonly tracking = TRACKING;
}
