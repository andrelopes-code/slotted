import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { provideMenubarDefaults, SlMenubar } from '@slotted/angular/menubar';

@Component({
  selector: 'app-menubar-defaults',
  imports: [SlHeading, SlInline, SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar, SlStack, SlText],
  providers: [provideMenubarDefaults({ size: 'sm' })],
  template: `
    <div slStack [gap]="4">
      <div slInline align="center" [gap]="4">
        <h3 slHeading size="md">Northwind</h3>
        <sl-menubar aria-label="Operations">
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
      <p slText size="sm" tone="muted">A bar that states its own size keeps it</p>
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
export class MenubarDefaults {}
