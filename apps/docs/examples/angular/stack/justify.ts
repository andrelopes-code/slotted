import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-stack-justify',
  imports: [SlBadge, SlCard, SlCardBody, SlCardHeader, SlGrid, SlHeading, SlStack],
  template: `
    <div slGrid minItemWidth="xs" [columns]="3" [gap]="4">
      @for (justify of justifies; track justify) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">justify {{ justify }}</h2>
          </div>
          <div slCardBody>
            <div slStack align="start" [gap]="2" [justify]="justify" style="block-size: 12rem">
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
export class StackJustify {
  protected readonly justifies = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
}
