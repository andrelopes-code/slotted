import { Component, computed, signal } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

function summary(taxable: boolean | 'mixed'): string {
  if (taxable === 'mixed') return 'Taxed on 2 of the 3 selected products.';
  return taxable
    ? 'All 3 selected products will be taxed.'
    : 'None of the 3 selected products will be taxed.';
}

@Component({
  selector: 'app-checkbox-indeterminate',
  imports: [SlCheckbox, SlCheckboxDescription, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <span slText weight="medium">Edit 3 products</span>
      <div
        slCheckbox
        [checked]="taxable() === true"
        [indeterminate]="taxable() === 'mixed'"
        (checkedChange)="taxable.set($event.value)"
      >
        Taxable
        <p slCheckboxDescription>{{ summary() }}</p>
      </div>
    </div>
  `,
})
export class CheckboxIndeterminate {
  readonly taxable = signal<boolean | 'mixed'>('mixed');
  readonly summary = computed(() => summary(this.taxable()));
}
