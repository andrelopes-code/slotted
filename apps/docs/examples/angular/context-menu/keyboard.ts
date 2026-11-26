import { Component } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem, SlMenuSeparator } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-keyboard',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlMenuSeparator, SlStack, SlText],
  template: `
    <div [slContextMenuTriggerFor]="actions" tabindex="0">
      <div slStack [gap]="1">
        <h2 slHeading size="md">Release notes 4.2</h2>
        <p slText size="sm" tone="muted">
          Press Tab to focus this item, then Shift+F10 or the Menu key.
        </p>
      </div>
    </div>
    <sl-menu #actions>
      <button slMenuItem>Open</button>
      <button slMenuItem>Copy link</button>
      <hr slMenuSeparator />
      <button slMenuItem>Archive</button>
    </sl-menu>
  `,
})
export class ContextMenuKeyboard {}
