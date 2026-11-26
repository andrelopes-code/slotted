import { Component } from '@angular/core';
import { provideAccordionDefaults, SlAccordion } from '@slotted/angular/accordion';
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
    value: 'po',
    title: 'Purchase order PO-44821 from Harbor & Pine Supply Co. awaiting approval',
    body: 'Requested by Mira Alvarez for $12,480.00.',
  },
  {
    value: 'rma',
    title: 'Return authorization RMA-3107 for 24 damaged cartons',
    body: 'Credit of $1,036.80 issues after inspection.',
  },
];

@Component({
  selector: 'app-accordion-defaults',
  imports: [
    SlAccordion,
    SlStack,
    SlText,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  providers: [
    provideAccordionDefaults({ variant: 'separated', indicator: 'plus-minus', truncate: true }),
  ],
  template: `
    <div slStack [gap]="6">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">From the defaults</p>
        <div slAccordion [value]="['po']">
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
        <p slText size="sm" tone="muted">variant="plain" on the set</p>
        <div slAccordion variant="plain" [value]="['po']">
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
export class AccordionDefaults {
  protected readonly sections = SECTIONS;
}
