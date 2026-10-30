import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-checkbox-hidden-label',
  imports: [SlCheckbox, SlInline, SlStack, SlText, SlVisuallyHidden],
  template: `
    <div slStack [gap]="2">
      @for (invoice of invoices; track invoice.id) {
        <div slInline [gap]="3" align="center">
          <div slCheckbox size="sm" [value]="invoice.id">
            <span slVisuallyHidden>Select {{ invoice.id }}</span>
          </div>
          <span slText numeric="tabular">{{ invoice.id }}</span>
          <span slText tone="muted">{{ invoice.customer }}</span>
          <span slText numeric="tabular">{{ invoice.amount }}</span>
        </div>
      }
    </div>
  `,
})
export class CheckboxHiddenLabel {
  readonly invoices = [
    { id: 'INV-1042', customer: 'Alfreds Futterkiste', amount: '$1,250.00' },
    { id: 'INV-1043', customer: 'Ernst Handel', amount: '$4,318.40' },
    { id: 'INV-1044', customer: 'Island Trading', amount: '$872.15' },
  ];
}
