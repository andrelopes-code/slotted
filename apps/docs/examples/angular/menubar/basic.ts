import { Component } from '@angular/core';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-basic',
  imports: [SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger, SlMenubar],
  template: `
    <sl-menubar aria-label="Operations">
      <button [slMenuTriggerFor]="orders">Orders</button>
      <sl-menu #orders value="orders">
        <button slMenuItem shortcut="Mod+N">New order</button>
        <button slMenuItem shortcut="Mod+O">Open order…</button>
        <hr slMenuSeparator />
        <button slMenuItem shortcut="Mod+P">Print packing slip</button>
      </sl-menu>
      <button [slMenuTriggerFor]="inventory">Inventory</button>
      <sl-menu #inventory value="inventory">
        <button slMenuItem>Receive stock</button>
        <button slMenuItem>Count stock</button>
        <button slMenuItem>Transfer stock</button>
      </sl-menu>
      <button [slMenuTriggerFor]="reports">Reports</button>
      <sl-menu #reports value="reports">
        <button slMenuItem>Sales by region</button>
        <button slMenuItem>Stock aging</button>
        <button slMenuItem>Late shipments</button>
      </sl-menu>
    </sl-menubar>
  `,
})
export class MenubarBasic {}
