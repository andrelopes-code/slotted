import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-keyboard',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Shipping weight</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="12.5"
            min="0"
            step="1"
            largeStep="10"
            smallStep="0.1"
            [format]="{ maximumFractionDigits: 1, style: 'unit', unit: 'kilogram' }"
          />
        </div>
        <span slFieldDescription>Arrows: 1 kg. Shift or Page keys: 10 kg. Alt: 0.1 kg.</span>
      </div>
      <div slField>
        <label slFieldLabel>Safety stock</label>
        <div slNumberField>
          <input slNumberFieldInput defaultValue="15" min="0" wheel />
        </div>
        <span slFieldDescription>With the field focused, the mouse wheel steps the value.</span>
      </div>
    </div>
  `,
})
export class NumberFieldKeyboard {}
