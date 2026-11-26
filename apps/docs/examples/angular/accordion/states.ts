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

const REVIEW = [
  {
    value: 'delivery',
    title: 'Delivery',
    body: 'Scheduled for September 12 with Harbor Freight, tracking HF-48213.',
  },
  { value: 'payment', title: 'Payment', body: 'Invoice INV-20877 for $2,146.50, due October 4.' },
  {
    value: 'hold',
    title: 'Credit hold',
    body: 'Released by finance on October 1.',
    disabled: true,
  },
];

@Component({
  selector: 'app-accordion-states',
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
        <p slText size="sm" tone="muted">disabled</p>
        <div slAccordion disabled [value]="['payment']">
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
        <p slText size="sm" tone="muted">disabled on one item</p>
        <div slAccordion [value]="['payment']">
          @for (section of review; track section.value) {
            <div slCollapsible [value]="section.value" [disabled]="section.disabled">
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
export class AccordionStates {
  protected readonly sections = SECTIONS;
  protected readonly review = REVIEW;
}
