import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlMenu,
  SlMenuItem,
  SlMenuTrigger,
  type MenuAlign,
  type MenuSide,
} from '@slotted/angular/menu';

const PLACEMENTS: { label: string; side: MenuSide; align: MenuAlign }[] = [
  { label: 'Bottom, start', side: 'bottom', align: 'start' },
  { label: 'Bottom, end', side: 'bottom', align: 'end' },
  { label: 'Top, start', side: 'top', align: 'start' },
  { label: 'Inline end', side: 'inline-end', align: 'start' },
];

@Component({
  selector: 'app-menu-placement',
  imports: [SlButton, SlInline, SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <div slInline align="center" wrap="wrap" [gap]="3">
      @for (placement of placements; track placement.label) {
        <button slButton variant="outline" [slMenuTriggerFor]="menu">{{ placement.label }}</button>
        <sl-menu #menu [align]="placement.align" [side]="placement.side">
          <button slMenuItem>Rename…</button>
          <button slMenuItem>Duplicate</button>
          <button slMenuItem>Archive</button>
        </sl-menu>
      }
    </div>
  `,
})
export class MenuPlacement {
  protected readonly placements = PLACEMENTS;
}
