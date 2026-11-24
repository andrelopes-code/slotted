import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-columns',
  imports: [SlCard, SlCardBody, SlGrid, SlHeading, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      @for (count of counts; track count) {
        <div slStack [gap]="3">
          <p slText size="sm" tone="muted">columns: {{ count }}</p>

          <div slGrid [columns]="count" [gap]="4" minItemWidth="xs">
            @for (metric of metrics; track metric.label) {
              <div slCard>
                <div slCardBody>
                  <div slStack [gap]="1">
                    <p slText size="sm" tone="muted">{{ metric.label }}</p>
                    <h2 slHeading size="md">{{ metric.value }}</h2>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class GridColumns {
  protected readonly counts = [2, 3, 4] as const;

  protected readonly metrics = [
    { label: 'Revenue', value: '$48,200' },
    { label: 'Refunds', value: '$1,940' },
    { label: 'Disputes', value: '7' },
    { label: 'Payouts', value: '$44,310' },
  ] as const;
}
