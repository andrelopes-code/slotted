import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuItem,
  SlMenuItemMeta,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';

const VIEWS = [
  { label: 'Awaiting payment', count: '18' },
  { label: 'Ready to ship', count: '42' },
  { label: 'On hold', count: '3' },
  { label: 'Returns', count: '7' },
];

@Component({
  selector: 'app-menu-meta',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuItem,
    SlMenuItemMeta,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="viewMenu">
      All orders
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #viewMenu>
      <button slMenuItem>All orders <span slMenuItemMeta>1,284</span></button>
      <hr slMenuSeparator />
      @for (view of views; track view.label) {
        <button slMenuItem>
          {{ view.label }} <span slMenuItemMeta>{{ view.count }}</span>
        </button>
      }
    </sl-menu>
  `,
})
export class MenuMeta {
  protected readonly views = VIEWS;
}
