import { Component, signal } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';
import type { ChangeRequest } from '@slotted/core/state';

@Component({
  selector: 'app-context-menu-controlled',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div [slContextMenuTriggerFor]="actions" tabindex="0">
        <div slStack [gap]="1">
          <h2 slHeading size="md">Purchase order PO-5521</h2>
          <p slText size="sm" tone="muted">
            Right-click, press Shift+F10, press Escape or click elsewhere.
          </p>
        </div>
      </div>
      <sl-menu #actions [(open)]="open" (openChangeRequest)="record($event)">
        <button slMenuItem>Approve</button>
        <button slMenuItem>Request changes</button>
        <button slMenuItem>Send to supplier</button>
      </sl-menu>
      <p slText size="sm" tone="muted">{{ last() }}</p>
    </div>
  `,
})
export class ContextMenuControlled {
  protected readonly open = signal(false);
  protected readonly last = signal('Closed');

  protected record(request: ChangeRequest<boolean>): void {
    this.last.set(`${request.value ? 'Opened' : 'Closed'} by ${request.reason}`);
  }
}
