import { Component } from '@angular/core';
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

const TASKS = [
  {
    value: 'receiving',
    title: 'Receiving',
    body: '14 pallets arrive today between 08:00 and 15:00.',
  },
  { value: 'putaway', title: 'Putaway', body: '6 pallets wait in dock 3 for a bin assignment.' },
  { value: 'counts', title: 'Cycle counts', body: 'Aisles 12 to 15 are due this week.' },
  {
    value: 'archive',
    title: 'Archived pallets',
    body: 'Moved to cold storage on September 30.',
    disabled: true,
  },
];

@Component({
  selector: 'app-accordion-imperative',
  imports: [
    SlAccordion,
    SlButton,
    SlInline,
    SlStack,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="2">
        <button slButton size="sm" variant="outline" (click)="set.openAll()">Open all</button>
        <button slButton size="sm" variant="outline" (click)="set.closeAll()">Close all</button>
      </div>
      <div slAccordion #set="slAccordion" multiple>
        @for (task of tasks; track task.value) {
          <div slCollapsible [value]="task.value" [disabled]="task.disabled">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger>{{ task.title }}</button>
            </h3>
            <div slCollapsiblePanel>{{ task.body }}</div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AccordionImperative {
  protected readonly tasks = TASKS;
}
