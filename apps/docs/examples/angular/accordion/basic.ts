import { Component } from '@angular/core';
import { SlAccordion } from '@slotted/angular/accordion';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';

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
  selector: 'app-accordion-basic',
  imports: [
    SlAccordion,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slAccordion [value]="['delivery']">
      @for (section of sections; track section.value) {
        <div slCollapsible [value]="section.value">
          <h3 slCollapsibleHeader>
            <button slCollapsibleTrigger>{{ section.title }}</button>
          </h3>
          <div slCollapsiblePanel>{{ section.body }}</div>
        </div>
      }
    </div>
  `,
})
export class AccordionBasic {
  protected readonly sections = SECTIONS;
}
