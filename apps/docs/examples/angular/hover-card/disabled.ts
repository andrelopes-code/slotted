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
  selector: 'app-hover-card-disabled',
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
      Territory handoff from
      <ng-container slHoverCard>
        <a slHoverCardTrigger href="/people/nancy.davolio">&#64;nancy.davolio</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">Nancy Davolio, Sales Representative, Seattle.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      to
      <ng-container slHoverCard disabled>
        <a slHoverCardTrigger href="/people/robert.king">&#64;robert.king</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">Robert King, Sales Representative, London.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template> </ng-container
      >, whose profile is archived.
    </p>
  `,
})
export class HoverCardDisabled {}
