import { Component } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-long-press-off',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlStack, SlText],
  template: `
    <div [slContextMenuTriggerFor]="actions" [longPress]="false" tabindex="0">
      <div slStack [gap]="1">
        <h2 slHeading size="md">Invoice INV-3307</h2>
        <p slText size="sm" tone="muted">Touch and pen keep their own long-press behavior here.</p>
      </div>
    </div>
    <sl-menu #actions>
      <button slMenuItem>Send reminder</button>
      <button slMenuItem>Record payment</button>
      <button slMenuItem>Download PDF</button>
    </sl-menu>
  `,
})
export class ContextMenuLongPressOff {}
