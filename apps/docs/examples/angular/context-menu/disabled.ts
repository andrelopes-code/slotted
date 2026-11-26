import { Component } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-disabled',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div [slContextMenuTriggerFor]="enabled">
        <div slStack [gap]="1">
          <h2 slHeading size="md">Draft report</h2>
          <p slText size="sm" tone="muted">Enabled: right-click opens the commands.</p>
        </div>
      </div>
      <sl-menu #enabled>
        <button slMenuItem>Edit</button>
        <button slMenuItem>Publish</button>
      </sl-menu>
      <div [slContextMenuTriggerFor]="locked">
        <div slStack [gap]="1">
          <h2 slHeading size="md">Published report</h2>
          <p slText size="sm" tone="muted">Disabled: right-click opens the browser menu.</p>
        </div>
      </div>
      <sl-menu #locked [disabled]="true">
        <button slMenuItem>Edit</button>
        <button slMenuItem>Unpublish</button>
      </sl-menu>
    </div>
  `,
})
export class ContextMenuDisabled {}
