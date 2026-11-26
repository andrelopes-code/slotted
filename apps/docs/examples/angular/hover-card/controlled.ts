import { Component, signal } from '@angular/core';
import { SlHoverCard, SlHoverCardTrigger } from '@slotted/angular/hover-card';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
} from '@slotted/angular/popover';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-controlled',
  imports: [
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverDescription,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <p slText>
        Stock for order 10251 ships from the
        <ng-container slHoverCard [(open)]="open" (openChangeRequest)="reason.set($event.reason)">
          <a slHoverCardTrigger href="/warehouses/seattle">Seattle warehouse</a>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverHeader>
                <div slPopoverTitle>Seattle warehouse</div>
                <p slPopoverDescription>400 Pine Street, Dock 3</p>
              </div>
              <div slPopoverBody>
                <p slText size="sm">Pickups close at 4:30 PM, Monday to Friday.</p>
              </div>
            </div>
            <div slPopoverArrow></div>
          </ng-template> </ng-container
        >.
      </p>
      <p slText size="sm" tone="muted">
        Card {{ open() ? 'open' : 'closed' }}. Last request: {{ reason() }}.
      </p>
    </div>
  `,
})
export class HoverCardControlled {
  readonly open = signal(false);
  readonly reason = signal('none');
}
