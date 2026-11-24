import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader } from '@slotted/angular/card';
import type { CardSize } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-sizes',
  imports: [SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlGrid, SlHeading, SlText],
  template: `
    <div slGrid [columns]="3" [gap]="4" minItemWidth="xs">
      @for (size of sizes; track size) {
        <div slCard [size]="size">
          <div slCardHeader>
            <h2 slHeading size="md">Invoice 20418</h2>
            <p slText size="sm" tone="muted">size: {{ size }}</p>
          </div>
          <div slCardBody>
            <p slText>$4,820.00, due 15 December.</p>
          </div>
          <div slCardFooter>
            <p slText size="sm" tone="muted">Meridian Packaging</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class CardSizes {
  protected readonly sizes: CardSize[] = ['sm', 'md', 'lg'];
}
