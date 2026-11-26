import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlHoverCard, SlHoverCardTrigger } from '@slotted/angular/hover-card';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
} from '@slotted/angular/popover';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-navigable',
  imports: [
    SlButton,
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverDescription,
    SlPopoverFooter,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlText,
  ],
  template: `
    <p slText>
      The credit limit for Around the Horn is waiting on
      <ng-container slHoverCard navigable>
        <a slHoverCardTrigger href="/people/andrew.fuller">&#64;andrew.fuller</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Andrew Fuller</div>
              <p slPopoverDescription>Vice President, Sales</p>
            </div>
            <div slPopoverBody>
              <p slText size="sm">Approves credit limits above $25,000.</p>
            </div>
            <div slPopoverFooter>
              <button slButton size="sm">Send message</button>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template> </ng-container
      >.
    </p>
  `,
})
export class HoverCardNavigable {}
