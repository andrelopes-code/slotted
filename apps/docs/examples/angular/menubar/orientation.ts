import { Component } from '@angular/core';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-orientation',
  imports: [SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar],
  template: `
    <sl-menubar aria-label="Workspace" orientation="vertical">
      <button [slMenuTriggerFor]="orders">Orders</button>
      <sl-menu #orders value="orders">
        <button slMenuItem>New order</button>
        <button slMenuItem>Open order…</button>
      </sl-menu>
      <button [slMenuTriggerFor]="inventory">Inventory</button>
      <sl-menu #inventory value="inventory">
        <button slMenuItem>Receive stock</button>
        <button slMenuItem>Count stock</button>
      </sl-menu>
      <button [slMenuTriggerFor]="reports">Reports</button>
      <sl-menu #reports value="reports">
        <button slMenuItem>Sales by region</button>
        <button slMenuItem>Late shipments</button>
      </sl-menu>
    </sl-menubar>
  `,
})
export class MenubarOrientation {}
