import { Component } from '@angular/core';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlMenubar } from '@slotted/angular/menubar';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-menubar-states',
  imports: [SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar, SlStack],
  template: `
    <div slStack [gap]="4">
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
        <button [slMenuTriggerFor]="archive">Archive</button>
        <sl-menu #archive value="archive" [disabled]="true">
          <button slMenuItem>Restore order</button>
        </sl-menu>
      </sl-menubar>
      <sl-menubar aria-label="Closed period" [disabled]="true">
        <button [slMenuTriggerFor]="journal">Journal</button>
        <sl-menu #journal value="journal">
          <button slMenuItem>Post entry</button>
          <button slMenuItem>Reverse entry</button>
        </sl-menu>
        <button [slMenuTriggerFor]="ledger">Ledger</button>
        <sl-menu #ledger value="ledger">
          <button slMenuItem>Reconcile account</button>
        </sl-menu>
      </sl-menubar>
    </div>
  `,
})
export class MenubarStates {}
