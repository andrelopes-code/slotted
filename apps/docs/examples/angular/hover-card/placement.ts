import { Component } from '@angular/core';
import { SlHoverCard, SlHoverCardTrigger } from '@slotted/angular/hover-card';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
} from '@slotted/angular/popover';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-placement',
  imports: [
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlText,
  ],
  template: `
    <p slText>
      Reorder
      <ng-container slHoverCard side="top" align="center">
        <a slHoverCardTrigger href="/products/1001">Chai</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">NW-1001, 39 units on hand.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template> </ng-container
      >,
      <ng-container slHoverCard>
        <a slHoverCardTrigger href="/products/1002">Chang</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">NW-1002, 17 units on hand.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      and
      <ng-container slHoverCard side="inline-end" align="center">
        <a slHoverCardTrigger href="/products/1003">Aniseed Syrup</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">NW-1003, 13 units on hand.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      before Friday.
    </p>
  `,
})
export class HoverCardPlacement {}
