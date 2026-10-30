import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-decimals',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Exchange rate, EUR to USD</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="1.0842"
            min="0"
            step="0.0001"
            [format]="{ maximumFractionDigits: 4, minimumFractionDigits: 4 }"
          />
        </div>
        <span slFieldDescription>Four decimals: 1.1 becomes 1.1000 on blur.</span>
      </div>
      <div slField>
        <label slFieldLabel>Cartons</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="40"
            min="0"
            [format]="{ maximumFractionDigits: 0 }"
          />
        </div>
        <span slFieldDescription>Whole cartons: the decimal separator is refused.</span>
      </div>
    </div>
  `,
})
export class NumberFieldDecimals {}
