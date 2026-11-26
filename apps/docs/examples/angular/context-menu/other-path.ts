import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlInline } from '@slotted/angular/inline';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-other-path',
  imports: [
    SlButton,
    SlContextMenuTrigger,
    SlHeading,
    SlInline,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
    SlStack,
    SlText,
  ],
  template: `
    <div [slContextMenuTriggerFor]="fromRegion">
      <div slStack [gap]="2">
        <h2 slHeading size="md">Shipment SH-20418</h2>
        <p slText size="sm" tone="muted">
          Right-click this shipment or press Actions: both open the same commands.
        </p>
        <div slInline>
          <button slButton variant="outline" [slMenuTriggerFor]="fromButton">Actions</button>
        </div>
      </div>
    </div>
    <sl-menu #fromRegion aria-label="Shipment actions">
      <button slMenuItem>Track shipment</button>
      <button slMenuItem>Print label</button>
      <button slMenuItem>Contact carrier</button>
    </sl-menu>
    <sl-menu #fromButton aria-label="Shipment actions">
      <button slMenuItem>Track shipment</button>
      <button slMenuItem>Print label</button>
      <button slMenuItem>Contact carrier</button>
    </sl-menu>
  `,
})
export class ContextMenuOtherPath {}
