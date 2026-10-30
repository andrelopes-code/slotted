import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-states',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField invalid>
        <label slFieldLabel>VAT number</label>
        <div slTextField><input slTextFieldInput defaultValue="DE 81234" /></div>
        <span slFieldError>A German VAT number has nine digits after DE.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Order number</label>
        <div slTextField mono><input slTextFieldInput defaultValue="SO-2026-00418" /></div>
        <span slFieldDescription>Assigned when the order was placed.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Currency</label>
        <div slTextField><input slTextFieldInput defaultValue="USD" /></div>
        <span slFieldDescription>Set by the customer’s price list.</span>
      </div>
    </div>
  `,
})
export class TextFieldStates {}
