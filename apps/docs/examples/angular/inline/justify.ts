import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-inline-justify',
  imports: [SlBadge, SlCard, SlCardBody, SlCardHeader, SlHeading, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      @for (justify of justifies; track justify) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">justify {{ justify }}</h2>
          </div>
          <div slCardBody>
            <div slInline [justify]="justify">
              <span slBadge tone="info">Packed</span>
              <span slBadge tone="warning">Shipped</span>
              <span slBadge tone="success">Delivered</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class InlineJustify {
  protected readonly justifies = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
}
