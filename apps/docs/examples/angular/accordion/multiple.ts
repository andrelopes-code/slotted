import { Component } from '@angular/core';
import { SlAccordion } from '@slotted/angular/accordion';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';

const TASKS = [
  {
    value: 'receiving',
    title: 'Receiving',
    body: '14 pallets arrive today between 08:00 and 15:00.',
  },
  { value: 'putaway', title: 'Putaway', body: '6 pallets wait in dock 3 for a bin assignment.' },
  { value: 'counts', title: 'Cycle counts', body: 'Aisles 12 to 15 are due this week.' },
  { value: 'dispatch', title: 'Dispatch', body: 'The 16:30 carrier pickup holds 38 parcels.' },
];

@Component({
  selector: 'app-accordion-multiple',
  imports: [
    SlAccordion,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slAccordion multiple [value]="['receiving', 'putaway']">
      @for (task of tasks; track task.value) {
        <div slCollapsible [value]="task.value">
          <h3 slCollapsibleHeader>
            <button slCollapsibleTrigger>{{ task.title }}</button>
          </h3>
          <div slCollapsiblePanel>{{ task.body }}</div>
        </div>
      }
    </div>
  `,
})
export class AccordionMultiple {
  protected readonly tasks = TASKS;
}
