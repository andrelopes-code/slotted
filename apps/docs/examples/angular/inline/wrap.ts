import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-inline-wrap',
  imports: [SlBadge, SlCard, SlCardBody, SlCardHeader, SlHeading, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      @for (wrap of wraps; track wrap) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">wrap {{ wrap }}</h2>
          </div>
          <div slCardBody>
            <div slInline [gap]="2" [wrap]="wrap">
              @for (label of labels; track label) {
                <span slBadge tone="secondary" variant="outline">{{ label }}</span>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class InlineWrap {
  protected readonly wraps = ['wrap', 'nowrap'] as const;
  protected readonly labels = [
    'Wholesale',
    'Fragile',
    'Priority shipping',
    'Refrigerated',
    'Hazardous materials',
    'Signature required',
  ] as const;
}
