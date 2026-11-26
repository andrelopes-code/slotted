import { Component } from '@angular/core';
import { SlHoverCard, SlHoverCardTrigger } from '@slotted/angular/hover-card';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
} from '@slotted/angular/popover';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-delays',
  imports: [
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <p slText>
        Default delays, 600 ms to open and 300 ms to close:
        <ng-container slHoverCard>
          <a slHoverCardTrigger href="/orders/10248">Order 10248</a>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverBody>
                <p slText size="sm">Vins et alcools Chevalier, $440.00, shipped Jul 16.</p>
              </div>
            </div>
            <div slPopoverArrow></div>
          </ng-template>
        </ng-container>
      </p>
      <p slText>
        Immediate open, closes after 1 second:
        <ng-container slHoverCard [openDelay]="0" [closeDelay]="1000">
          <a slHoverCardTrigger href="/orders/10249">Order 10249</a>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverBody>
                <p slText size="sm">Toms Spezialitäten, $1,863.40, shipped Jul 10.</p>
              </div>
            </div>
            <div slPopoverArrow></div>
          </ng-template>
        </ng-container>
      </p>
    </div>
  `,
})
export class HoverCardDelays {}
