import { Component } from '@angular/core';
import {
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-options',
  imports: [SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuSeparator, SlMenuTrigger, SlMenubar],
  template: `
    <sl-menubar aria-label="Operations">
      <button [slMenuTriggerFor]="orders">Orders</button>
      <sl-menu #orders value="orders">
        <button slMenuItem>New order</button>
        <button slMenuItem>Open order…</button>
      </sl-menu>
      <button [slMenuTriggerFor]="view">View</button>
      <sl-menu #view value="view">
        <button slMenuCheckboxItem [checked]="true">Cancelled orders</button>
        <button slMenuCheckboxItem>Archived orders</button>
        <button slMenuCheckboxItem>Test orders</button>
        <hr slMenuSeparator />
        <sl-menu-radio-group aria-label="Group orders by" value="status">
          <button slMenuRadioItem value="status">By status</button>
          <button slMenuRadioItem value="customer">By customer</button>
          <button slMenuRadioItem value="warehouse">By warehouse</button>
        </sl-menu-radio-group>
      </sl-menu>
    </sl-menubar>
  `,
})
export class MenubarOptions {}
