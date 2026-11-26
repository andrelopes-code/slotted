import { Component, signal } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuGroup, SlMenuItem, SlMenuSeparator } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-canvas',
  imports: [
    SlContextMenuTrigger,
    SlHeading,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuSeparator,
    SlStack,
    SlText,
  ],
  template: `
    <div [slContextMenuTriggerFor]="actions">
      <div slStack [gap]="1">
        <h2 slHeading size="md">Warehouse floor plan</h2>
        <p slText size="sm" tone="muted">
          Aisles A1 to D4. {{ labels() ? 'Aisle labels on.' : 'Aisle labels off.' }}
          {{ paths() ? 'Pick paths on.' : 'Pick paths off.' }}
        </p>
      </div>
    </div>
    <sl-menu #actions aria-label="Floor plan actions">
      <sl-menu-group label="View">
        <button slMenuCheckboxItem [(checked)]="labels">Aisle labels</button>
        <button slMenuCheckboxItem [(checked)]="paths">Pick paths</button>
      </sl-menu-group>
      <hr slMenuSeparator />
      <button slMenuItem>Export as PDF</button>
    </sl-menu>
  `,
})
export class ContextMenuCanvas {
  protected readonly labels = signal(true);
  protected readonly paths = signal(false);
}
