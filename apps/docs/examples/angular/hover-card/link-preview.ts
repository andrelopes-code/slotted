import { Component } from '@angular/core';
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
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-link-preview',
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
    SlText,
  ],
  template: `
    <p slText>
      Freight for October follows the
      <ng-container slHoverCard>
        <a slHoverCardTrigger href="/documents/q4-carrier-rate-card">Q4 carrier rate card</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Q4 carrier rate card</div>
              <p slPopoverDescription>Spreadsheet, updated 2 hours ago</p>
            </div>
            <div slPopoverBody>
              <p slText size="sm">
                Freight rates by carrier and zone for October through December, with the fuel
                surcharge from Oct 1.
              </p>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template> </ng-container
      >, which Federal Shipping has already signed.
    </p>
  `,
})
export class HoverCardLinkPreview {}
