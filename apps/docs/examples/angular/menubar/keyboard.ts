import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-keyboard',
  imports: [SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">loop off: the arrows stop at the first and last trigger</p>
      <sl-menubar aria-label="Operations, no wrapping" [loop]="false">
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
      <p slText size="sm" tone="muted">typeahead off: typing a letter moves nothing</p>
      <sl-menubar aria-label="Operations, no typeahead" [typeahead]="false">
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
    </div>
  `,
})
export class MenubarKeyboard {}
