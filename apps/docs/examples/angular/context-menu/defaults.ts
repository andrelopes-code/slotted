import { Component } from '@angular/core';
import { provideContextMenuDefaults, SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-context-menu-defaults',
  imports: [SlContextMenuTrigger, SlHeading, SlMenu, SlMenuItem, SlStack, SlText],
  providers: [provideContextMenuDefaults({ longPressDelay: 800 })],
  template: `
    <div slStack [gap]="4">
      <div [slContextMenuTriggerFor]="inbound">
        <div slStack [gap]="1">
          <h2 slHeading size="md">Inbound dock</h2>
          <p slText size="sm" tone="muted">Holds for 800 ms, the delay the provider sets.</p>
        </div>
      </div>
      <sl-menu #inbound>
        <button slMenuItem>Schedule unloading</button>
        <button slMenuItem>View arrivals</button>
      </sl-menu>
      <div [slContextMenuTriggerFor]="outbound" [longPressDelay]="300">
        <div slStack [gap]="1">
          <h2 slHeading size="md">Outbound dock</h2>
          <p slText size="sm" tone="muted">Holds for 300 ms, the delay this target sets.</p>
        </div>
      </div>
      <sl-menu #outbound>
        <button slMenuItem>Schedule loading</button>
        <button slMenuItem>View departures</button>
      </sl-menu>
    </div>
  `,
})
export class ContextMenuDefaults {}
