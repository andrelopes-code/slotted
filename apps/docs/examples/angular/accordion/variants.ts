import { Component } from '@angular/core';
import { SlAccordion } from '@slotted/angular/accordion';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const SECTIONS = [
  {
    value: 'delivery',
    title: 'Delivery',
    body: 'Scheduled for September 12 with Harbor Freight, tracking HF-48213.',
  },
  { value: 'payment', title: 'Payment', body: 'Invoice INV-20877 for $2,146.50, due October 4.' },
];

const VARIANTS = ['plain', 'ruled', 'framed', 'separated'] as const;

@Component({
  selector: 'app-accordion-variants',
  imports: [
    SlAccordion,
    SlStack,
    SlText,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slStack [gap]="6">
      @for (value of variants; track value) {
        <div slStack [gap]="2">
          <p slText size="sm" tone="muted">variant="{{ value }}"</p>
          <div slAccordion [variant]="value" [value]="['delivery']">
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
      }
    </div>
  `,
})
export class AccordionVariants {
  protected readonly sections = SECTIONS;
  protected readonly variants = VARIANTS;
}
