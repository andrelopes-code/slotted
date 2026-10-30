import { Component, signal } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-field-controls',
  imports: [
    SlDatePicker,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlNumberField,
    SlNumberFieldInput,
    SlSelect,
    SlSelectItem,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField required>
        <label slFieldLabel>Payment terms</label>
        <sl-select placeholder="Choose terms" [items]="termOptions" [(value)]="terms">
          @for (term of termOptions; track term.value) {
            <sl-select-item [value]="term.value">{{ term.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slField required>
        <label slFieldLabel>Quantity</label>
        <div slNumberField>
          <input slNumberFieldInput defaultValue="12" min="1" max="500" />
        </div>
        <span slFieldDescription>Cases of 24 bags.</span>
      </div>
      <div slField>
        <label slFieldLabel>Delivery date</label>
        <div slDatePicker locale="en-US"></div>
      </div>
    </div>
  `,
})
export class FieldControls {
  readonly termOptions: SelectOption[] = [
    { value: 'net-15', label: 'Net 15' },
    { value: 'net-30', label: 'Net 30' },
    { value: 'net-60', label: 'Net 60' },
  ];
  readonly terms = signal<string | null>('net-30');
}
