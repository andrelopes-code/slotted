import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-stack-align',
  imports: [SlBadge, SlCard, SlCardBody, SlCardHeader, SlHeading, SlStack],
  template: `
    <div slStack [gap]="4">
      @for (align of aligns; track align) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">align {{ align }}</h2>
          </div>
          <div slCardBody>
            <div slStack [align]="align" [gap]="2">
              <span slBadge tone="info">Wholesale</span>
              <span slBadge tone="warning">Priority shipping</span>
              <span slBadge tone="secondary">Fragile</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class StackAlign {
  protected readonly aligns = ['start', 'center', 'end', 'stretch'] as const;
}
