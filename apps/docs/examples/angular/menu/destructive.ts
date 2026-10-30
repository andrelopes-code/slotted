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
  selector: 'app-menu-destructive',
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
    <button slButton variant="outline" [slMenuTriggerFor]="supplier">
      Supplier
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #supplier>
      <button slMenuItem>Edit details</button>
      <button slMenuItem tone="success">Approve for purchasing</button>
      <button slMenuItem tone="warning">Put payments on hold</button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger">
        Delete supplier…
        <span slMenuItemDescription
          >Removes Northwind Traders and its 18 open purchase orders.</span
        >
      </button>
    </sl-menu>
  `,
})
export class MenuDestructive {}
