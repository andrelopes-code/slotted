import { Component, signal } from '@angular/core';
import { SlAccordion } from '@slotted/angular/accordion';
import { SlButton } from '@slotted/angular/button';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const SECTIONS = [
  {
    value: 'delivery',
    title: 'Delivery',
    body: 'Scheduled for September 12 with Harbor Freight, tracking HF-48213.',
  },
  { value: 'payment', title: 'Payment', body: 'Invoice INV-20877 for $2,146.50, due October 4.' },
  {
    value: 'returns',
    title: 'Returns',
    body: 'Accepted within 30 days of delivery, with the original packing slip.',
  },
];

@Component({
  selector: 'app-accordion-controlled',
  imports: [
    SlAccordion,
    SlButton,
    SlInline,
    SlStack,
    SlText,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="3" align="center" justify="between">
        <p slText size="sm" tone="muted">
          Open: {{ open().join(', ') || 'none' }}. Last change by the reader: {{ reason() }}.
        </p>
        <button slButton size="sm" variant="outline" (click)="open.set(['payment'])">
          Show payment
        </button>
      </div>
      <div slAccordion [(value)]="open" (valueChangeRequest)="reason.set($event.reason)">
        @for (section of sections; track section.value) {
          <div slCollapsible [value]="section.value">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger>{{ section.title }}</button>
            </h3>
            <div slCollapsiblePanel>{{ section.body }}</div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AccordionControlled {
  protected readonly sections = SECTIONS;
  protected readonly open = signal<readonly string[]>(['delivery']);
  protected readonly reason = signal('none');
}
