import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-veil',
  imports: [SlCard, SlCardBody, SlHeading, SlLoadingOverlay, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @for (row of rows; track row.veil) {
        <div
          slLoadingOverlay
          [description]="row.veil"
          [messages]="{ label: 'Refreshing balances' }"
          [veil]="row.veil"
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
export class LoadingOverlayVeil {
  protected readonly rows = [
    { veil: 'wash', title: 'Open invoices', value: '14 invoices, $48,210.00' },
    { veil: 'blur', title: 'Overdue balance', value: '3 customers, $6,940.50' },
    { veil: 'none', title: 'Pending refunds', value: '2 orders, $318.00' },
  ] as const;
}
