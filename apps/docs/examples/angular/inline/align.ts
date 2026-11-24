import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-inline-align',
  imports: [
    SlBadge,
    SlButton,
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlHeading,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      @for (align of aligns; track align) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">align {{ align }}</h2>
          </div>
          <div slCardBody>
            <div slInline [align]="align">
              <span slText size="3xl" weight="semibold">14</span>
              <span slBadge tone="warning">Late pickups</span>
              <button slButton tone="secondary" variant="outline">Review</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class InlineAlign {
  protected readonly aligns = ['start', 'center', 'end', 'stretch'] as const;
}
