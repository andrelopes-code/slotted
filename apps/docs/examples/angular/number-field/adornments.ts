import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlNumberField,
  SlNumberFieldEnd,
  SlNumberFieldInput,
  SlNumberFieldStart,
} from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-adornments',
  imports: [
    SlField,
    SlFieldLabel,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlNumberFieldStart,
    SlStack,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Purchase price</label>
        <div slNumberField>
          <span slNumberFieldStart>$</span>
          <input
            slNumberFieldInput
            defaultValue="1480"
            min="0"
            [format]="{ minimumFractionDigits: 2 }"
          />
          <span slNumberFieldEnd>USD</span>
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Lead time</label>
        <div slNumberField>
          <input slNumberFieldInput defaultValue="14" min="0" max="120" />
          <span slNumberFieldEnd>days</span>
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldAdornments {}
