import { Component } from '@angular/core';
import {
  provideHoverCardDefaults,
  SlHoverCard,
  SlHoverCardTrigger,
} from '@slotted/angular/hover-card';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
} from '@slotted/angular/popover';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-defaults',
  imports: [
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlText,
  ],
  providers: [provideHoverCardDefaults({ openDelay: 200, closeDelay: 200 })],
  template: `
    <p slText>
      Escalate to
      <ng-container slHoverCard>
        <a slHoverCardTrigger href="/people/steven.buchanan">&#64;steven.buchanan</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">Steven Buchanan, Sales Manager, London.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      or, for returns, to
      <ng-container slHoverCard [closeDelay]="1000">
        <a slHoverCardTrigger href="/people/margaret.peacock">&#64;margaret.peacock</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <p slText size="sm">Margaret Peacock, Sales Representative, Redmond.</p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template> </ng-container
      >.
    </p>
  `,
})
export class HoverCardDefaults {}
