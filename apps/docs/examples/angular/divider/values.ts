import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlDivider } from '@slotted/angular/divider';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-values',
  imports: [SlCard, SlCardBody, SlDivider, SlInline, SlStack, SlText],
  template: `
    <div slCard>
      <div slCardBody>
        <div slInline [gap]="6">
          @for (figure of figures; track figure.label; let first = $first) {
            @if (!first) {
              <hr slDivider decorative orientation="vertical" />
            }
            <div slStack [gap]="1">
              <p slText size="sm" tone="muted">{{ figure.label }}</p>
              <p slText numeric="tabular" size="3xl" weight="semibold">{{ figure.value }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DividerValues {
  protected readonly figures = [
    { label: 'Orders', value: '1,284' },
    { label: 'Revenue', value: '$48,200' },
    { label: 'Returns', value: '2.1%' },
  ];
}
