import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const REASONS: SelectOption[] = [
  { value: 'damaged', label: 'Arrived damaged' },
  { value: 'wrong-item', label: 'Wrong item shipped' },
  { value: 'not-needed', label: 'No longer needed' },
];

const TERMS: SelectOption[] = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'net-30', label: 'Net 30' },
  { value: 'net-45', label: 'Net 45' },
];

@Component({
  selector: 'app-select-placeholder',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Return reason</label>
        <sl-select placeholder="Choose a reason">
          @for (reason of reasons; track reason.value) {
            <sl-select-item [value]="reason.value">{{ reason.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slField>
        <label slFieldLabel>Payment terms</label>
        <sl-select placeholder="Choose terms" value="net-30" [items]="terms">
          @for (term of terms; track term.value) {
            <sl-select-item [value]="term.value">{{ term.label }}</sl-select-item>
          }
        </sl-select>
      </div>
    </div>
  `,
})
export class SelectPlaceholder {
  protected readonly reasons = REASONS;
  protected readonly terms = TERMS;
}
