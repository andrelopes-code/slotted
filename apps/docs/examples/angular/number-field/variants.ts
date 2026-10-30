import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-variants',
  imports: [SlField, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Unit price</label>
        <div slNumberField variant="outline">
          <input
            slNumberFieldInput
            defaultValue="18"
            min="0"
            [format]="{ currency: 'USD', style: 'currency' }"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Discount</label>
        <div slNumberField variant="subtle">
          <input
            slNumberFieldInput
            defaultValue="0.05"
            min="0"
            max="1"
            step="0.01"
            [format]="{ style: 'percent' }"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Freight</label>
        <div slNumberField variant="plain" stepper="none">
          <input
            slNumberFieldInput
            defaultValue="32.38"
            min="0"
            [format]="{ currency: 'USD', style: 'currency' }"
          />
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldVariants {}
