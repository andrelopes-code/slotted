import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import type { CardFill } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-fills',
  imports: [SlCard, SlCardBody, SlCardHeader, SlGrid, SlHeading, SlText],
  template: `
    <div slGrid [columns]="3" [gap]="4" minItemWidth="xs">
      @for (summary of summaries; track summary.fill) {
        <div slCard [fill]="summary.fill">
          <div slCardHeader>
            <h2 slHeading size="md">{{ summary.title }}</h2>
            <p slText size="sm" tone="muted">fill: {{ summary.fill }}</p>
          </div>
          <div slCardBody>
            <p slText>{{ summary.body }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class CardFills {
  protected readonly summaries: { fill: CardFill; title: string; body: string }[] = [
    { fill: 'outline', title: 'Open purchase orders', body: '14 orders, 3 awaiting approval.' },
    { fill: 'elevated', title: 'Invoices due this week', body: '6 invoices totaling $18,240.' },
    { fill: 'subtle', title: 'Reorder alerts', body: '9 products below their reorder point.' },
  ];
}
