import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-format-on',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Annual purchase budget</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            formatOn="change"
            min="0"
            [format]="{ currency: 'USD', style: 'currency' }"
          />
        </div>
        <span slFieldDescription>Type 1250000: the grouping appears with each digit.</span>
      </div>
      <div slField>
        <label slFieldLabel>Amount from bank statement</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            formatOn="commit"
            min="0"
            [format]="{ currency: 'USD', style: 'currency' }"
          />
        </div>
        <span slFieldDescription>Your text stays as typed until Enter or blur.</span>
      </div>
    </div>
  `,
})
export class NumberFieldFormatOn {}
