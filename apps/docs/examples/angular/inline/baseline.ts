import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-inline-baseline',
  imports: [SlCard, SlCardBody, SlCardHeader, SlHeading, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @for (align of aligns; track align) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">align {{ align }}</h2>
          </div>
          <div slCardBody>
            <div slInline [align]="align" [gap]="3">
              <span slText tone="muted">Open invoices</span>
              <span slText numeric="tabular" size="3xl" weight="semibold">$48,200</span>
              <span slText size="sm" tone="muted">across 14 customers</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class InlineBaseline {
  protected readonly aligns = ['center', 'baseline'] as const;
}
