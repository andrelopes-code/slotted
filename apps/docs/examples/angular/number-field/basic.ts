import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';

@Component({
  selector: 'app-number-field-basic',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
  ],
  template: `
    <div slField required>
      <label slFieldLabel>Reorder point</label>
      <div slNumberField>
        <input slNumberFieldInput defaultValue="25" min="0" max="500" step="5" />
        <span slNumberFieldEnd>units</span>
      </div>
      <span slFieldDescription>Chai is reordered when stock falls to this level.</span>
    </div>
  `,
})
export class NumberFieldBasic {}
