import { Component } from '@angular/core';
import { SlAccordion } from '@slotted/angular/accordion';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';

const ACCOUNT = [
  { value: 'summary', title: 'Summary', body: 'Harbor & Pine Supply Co., customer since 2019.' },
  {
    value: 'contacts',
    title: 'Contacts',
    body: 'Mira Alvarez, purchasing, and Tomas Berg, accounts payable.',
  },
  {
    value: 'terms',
    title: 'Payment terms',
    body: 'Net 30, with a 2% discount when paid within 10 days.',
  },
];

@Component({
  selector: 'app-accordion-require-open',
  imports: [
    SlAccordion,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slAccordion requireOpen [value]="['summary']">
      @for (section of account; track section.value) {
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
export class AccordionRequireOpen {
  protected readonly account = ACCOUNT;
}
