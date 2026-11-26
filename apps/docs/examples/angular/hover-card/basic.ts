import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlHoverCard, SlHoverCardTrigger } from '@slotted/angular/hover-card';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
} from '@slotted/angular/popover';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-hover-card-basic',
  imports: [
    SlAvatar,
    SlHoverCard,
    SlHoverCardTrigger,
    SlInline,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlStack,
    SlText,
  ],
  template: `
    <p slText>
      The pricing table is ready for review. Ask
      <ng-container slHoverCard>
        <a slHoverCardTrigger href="/people/nancy.davolio">&#64;nancy.davolio</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <div slInline align="center" [gap]="3">
                <span slAvatar name="Nancy Davolio"></span>
                <div slStack [gap]="1">
                  <span slText weight="semibold">Nancy Davolio</span>
                  <span slText size="sm" tone="muted">Sales Representative, Seattle</span>
                </div>
              </div>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      about the carrier rates.
    </p>
  `,
})
export class HoverCardBasic {}
