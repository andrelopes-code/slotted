import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlMenu, SlMenuItem, SlMenuTrigger, type MenuSize } from '@slotted/angular/menu';

const SIZES: MenuSize[] = ['sm', 'md', 'lg'];

@Component({
  selector: 'app-menu-sizes',
  imports: [SlButton, SlInline, SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <div slInline align="center" [gap]="3">
      @for (size of sizes; track size) {
        <button slButton variant="outline" [size]="size" [slMenuTriggerFor]="menu">
          Actions, {{ size }}
        </button>
        <sl-menu #menu [size]="size">
          <button slMenuItem shortcut="Mod+E">Edit order</button>
          <button slMenuItem shortcut="Mod+D">Duplicate</button>
          <button slMenuItem>Print packing slip</button>
        </sl-menu>
      }
    </div>
  `,
})
export class MenuSizes {
  protected readonly sizes = SIZES;
}
