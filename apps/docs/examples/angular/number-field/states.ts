import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-states',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlNumberField,
    SlNumberFieldInput,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField invalid>
        <label slFieldLabel>Quantity to ship</label>
        <div slNumberField><input slNumberFieldInput defaultValue="120" min="1" /></div>
        <span slFieldError>Only 39 units of Chai are in stock.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Units on order</label>
        <div slNumberField><input slNumberFieldInput defaultValue="40" /></div>
        <span slFieldDescription>Counted from open purchase orders.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Units reserved</label>
        <div slNumberField><input slNumberFieldInput defaultValue="12" /></div>
        <span slFieldDescription>Released when the order ships.</span>
      </div>
    </div>
  `,
})
export class NumberFieldStates {}
