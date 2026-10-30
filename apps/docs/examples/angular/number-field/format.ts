import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-format',
  imports: [SlField, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Credit limit</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="25000"
            min="0"
            step="500"
            [format]="{ currency: 'USD', style: 'currency' }"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Sales tax</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="0.0825"
            min="0"
            max="1"
            step="0.0025"
            [format]="{ maximumFractionDigits: 2, style: 'percent' }"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Pallet volume</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="1.8"
            min="0"
            step="0.1"
            [format]="{ style: 'unit', unit: 'liter', unitDisplay: 'long' }"
          />
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldFormat {}
