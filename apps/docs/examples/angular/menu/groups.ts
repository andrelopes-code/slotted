import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';

@Component({
  selector: 'app-menu-groups',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="order">
      SO-10482
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #order>
      <sl-menu-group label="Fulfilment">
        <button slMenuItem>Mark as packed</button>
        <button slMenuItem>Mark as shipped</button>
        <button slMenuItem>Print packing slip</button>
      </sl-menu-group>
      <hr slMenuSeparator />
      <sl-menu-group label="Billing">
        <button slMenuItem>Send invoice</button>
        <button slMenuItem>Record payment…</button>
      </sl-menu-group>
      <hr slMenuSeparator />
      <sl-menu-group label="Customer">
        <button slMenuItem>Open Northwind Traders</button>
        <button slMenuItem>Email the buyer</button>
      </sl-menu-group>
    </sl-menu>
  `,
})
export class MenuGroups {}
