import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-sizes',
  imports: [SlCard, SlCardBody, SlHeading, SlLoadingOverlay, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @for (row of rows; track row.size) {
        <div
          slLoadingOverlay
          [description]="row.size"
          [messages]="{ label: 'Reconciling' }"
          [size]="row.size"
        >
          <div slCard>
            <div slCardBody>
              <h3 slHeading size="md">{{ row.title }}</h3>
              <p slText>{{ row.value }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LoadingOverlaySizes {
  protected readonly rows = [
    { size: 'sm', title: 'Bank statement', value: '312 lines, 18 unmatched' },
    { size: 'md', title: 'Card payouts', value: '41 payouts, 2 on hold' },
    { size: 'lg', title: 'Supplier invoices', value: '27 invoices, 5 due this week' },
  ] as const;
}
