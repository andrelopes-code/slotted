import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-steppers',
  imports: [SlField, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Reorder quantity</label>
        <div slNumberField stepper="stacked">
          <input slNumberFieldInput defaultValue="40" min="0" step="10" />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Quantity</label>
        <div slNumberField stepper="split">
          <input slNumberFieldInput defaultValue="3" min="1" max="99" />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Units in stock</label>
        <div slNumberField stepper="none">
          <input slNumberFieldInput defaultValue="39" min="0" />
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldSteppers {}
