import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-range',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Pallets on the trailer</label>
        <div slNumberField>
          <input slNumberFieldInput defaultValue="26" min="0" max="26" />
        </div>
        <span slFieldDescription>A 53-foot trailer holds 26 pallets.</span>
      </div>
      <div slField>
        <label slFieldLabel>Bottles of Chartreuse verte</label>
        <div slNumberField>
          <input slNumberFieldInput defaultValue="12" min="6" step="6" snapToStep />
        </div>
        <span slFieldDescription>Sold in cases of 6. Type 20 and leave the field.</span>
      </div>
    </div>
  `,
})
export class NumberFieldRange {}
