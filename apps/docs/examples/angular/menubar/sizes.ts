import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-sizes',
  imports: [SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">sm</p>
      <sl-menubar aria-label="Operations, small" size="sm">
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
      </sl-menubar>
      <p slText size="sm" tone="muted">md</p>
      <sl-menubar aria-label="Operations, medium" size="md">
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
      </sl-menubar>
      <p slText size="sm" tone="muted">lg</p>
      <sl-menubar aria-label="Operations, large" size="lg">
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
      </sl-menubar>
    </div>
  `,
})
export class MenubarSizes {}
