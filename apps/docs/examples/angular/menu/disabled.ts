import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuItem,
  SlMenuItemDescription,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';

@Component({
  selector: 'app-menu-disabled',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuItem,
    SlMenuItemDescription,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="shipped">
      SO-10477 · Shipped
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #shipped>
      <button slMenuItem>Track shipment</button>
      <button slMenuItem>Create return…</button>
      <button slMenuItem [disabled]="true">
        Edit order
        <span slMenuItemDescription>A shipped order can no longer be edited.</span>
      </button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger" [disabled]="true">
        Cancel order
        <span slMenuItemDescription>Create a return instead.</span>
      </button>
    </sl-menu>
  `,
})
export class MenuDisabled {}
