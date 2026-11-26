import { Component } from '@angular/core';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-submenus',
  imports: [SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger, SlMenubar],
  template: `
    <sl-menubar aria-label="Operations">
      <button [slMenuTriggerFor]="orders">Orders</button>
      <sl-menu #orders value="orders">
        <button slMenuItem>New order</button>
        <button slMenuItem [slMenuTriggerFor]="exportAs">Export as</button>
        <sl-menu #exportAs>
          <button slMenuItem>CSV</button>
          <button slMenuItem>PDF</button>
          <button slMenuItem>Excel workbook</button>
        </sl-menu>
        <hr slMenuSeparator />
        <button slMenuItem>Print packing slip</button>
      </sl-menu>
      <button [slMenuTriggerFor]="inventory">Inventory</button>
      <sl-menu #inventory value="inventory">
        <button slMenuItem>Receive stock</button>
        <button slMenuItem [slMenuTriggerFor]="moveTo">Move to warehouse</button>
        <sl-menu #moveTo>
          <button slMenuItem>Rotterdam</button>
          <button slMenuItem>Leipzig</button>
          <button slMenuItem>Lyon</button>
          <button slMenuItem>Gdańsk</button>
        </sl-menu>
      </sl-menu>
    </sl-menubar>
  `,
})
export class MenubarSubmenus {}
