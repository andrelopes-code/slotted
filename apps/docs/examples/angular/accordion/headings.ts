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

@Component({
  selector: 'app-accordion-headings',
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
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">headingLevel="2"</p>
        <div slAccordion headingLevel="2" [value]="['delivery']">
          @for (section of sections; track section.value) {
            <div slCollapsible [value]="section.value">
              <h2 slCollapsibleHeader>
                <button slCollapsibleTrigger>{{ section.title }}</button>
              </h2>
              <div slCollapsiblePanel>{{ section.body }}</div>
            </div>
          }
        </div>
      </div>

      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">headingLevel="none"</p>
        <div slAccordion headingLevel="none" [value]="['delivery']">
          @for (section of sections; track section.value) {
            <div slCollapsible [value]="section.value">
              <div slCollapsibleHeader>
                <button slCollapsibleTrigger>{{ section.title }}</button>
              </div>
              <div slCollapsiblePanel>{{ section.body }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AccordionHeadings {
  protected readonly sections = SECTIONS;
}
