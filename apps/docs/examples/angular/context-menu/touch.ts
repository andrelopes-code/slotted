import { Component } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-touch',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlStack, SlText],
  template: `
    <div [slContextMenuTriggerFor]="actions" [longPressDelay]="800">
      <div slStack [gap]="1">
        <h2 slHeading size="md">Order SO-10482</h2>
        <p slText size="sm" tone="muted">Out for delivery. On touch, hold for 800 ms.</p>
      </div>
    </div>
    <sl-menu #actions>
      <button slMenuItem>View order</button>
      <button slMenuItem>Track delivery</button>
      <button slMenuItem>Print packing slip</button>
    </sl-menu>
  `,
})
export class ContextMenuTouch {}
