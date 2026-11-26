import { Component } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem, SlMenuSeparator } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-basic',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlMenuSeparator, SlStack, SlText],
  template: `
    <div [slContextMenuTriggerFor]="actions">
      <div slStack [gap]="1">
        <h2 slHeading size="md">Q3 board deck.pdf</h2>
        <p slText size="sm" tone="muted">
          4.2 MB, edited yesterday. Right-click anywhere on this file.
        </p>
      </div>
    </div>
    <sl-menu #actions>
      <button slMenuItem>Open</button>
      <button slMenuItem>Rename</button>
      <button slMenuItem>Duplicate</button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger">Move to trash</button>
    </sl-menu>
  `,
})
export class ContextMenuBasic {}
