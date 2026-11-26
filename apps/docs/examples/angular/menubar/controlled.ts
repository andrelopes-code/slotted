import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';
import type { ChangeRequest } from '@slotted/core/state';

@Component({
  selector: 'app-menubar-controlled',
  imports: [SlButton, SlInline, SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <sl-menubar aria-label="Operations" [(value)]="open" (valueChangeRequest)="record($event)">
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
      <div slInline align="center" wrap="wrap" [gap]="3">
        <button slButton variant="ghost" (click)="open.set('inventory')">Open Inventory</button>
        <button slButton variant="ghost" (click)="open.set(undefined)">Close</button>
        <span slText size="sm" tone="muted">{{ last() }}</span>
      </div>
    </div>
  `,
})
export class MenubarControlled {
  protected readonly open = signal<string | undefined>(undefined);
  protected readonly last = signal('No menu open');

  protected record(request: ChangeRequest<string>): void {
    this.last.set(
      request.value === ''
        ? `Closed by ${request.reason}`
        : `${request.value} opened by ${request.reason}`,
    );
  }
}
