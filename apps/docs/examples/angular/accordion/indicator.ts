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
  selector: 'app-accordion-indicator',
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
        <p slText size="sm" tone="muted">indicator="chevron"</p>
        <div slAccordion indicator="chevron" [value]="['delivery']">
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
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">indicator="plus-minus" togglePlacement="start"</p>
        <div slAccordion indicator="plus-minus" togglePlacement="start" [value]="['delivery']">
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
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">indicator="none"</p>
        <div slAccordion indicator="none" [value]="['delivery']">
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
    </div>
  `,
})
export class AccordionIndicator {
  protected readonly sections = SECTIONS;
}
