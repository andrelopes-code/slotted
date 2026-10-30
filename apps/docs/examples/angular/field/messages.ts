import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-messages',
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
      <div slField>
        <label slFieldLabel>Purchase order</label>
        <div slTextField><input slTextFieldInput defaultValue="PO-20418" /></div>
        <span slFieldDescription>Printed on the invoice so your accounts team can match it.</span>
      </div>
      <div slField invalid>
        <label slFieldLabel>Postal code</label>
        <div slTextField><input slTextFieldInput defaultValue="981" /></div>
        <span slFieldDescription>Five digits, as on the shipping label.</span>
        <span slFieldError>Enter all five digits.</span>
      </div>
      <div slField>
        <label slFieldLabel>Discount</label>
        <div slTextField><input slTextFieldInput defaultValue="45%" /></div>
        <span slFieldError tone="warning">Above 40% the order waits for a manager's approval.</span>
      </div>
    </div>
  `,
})
export class FieldMessages {}
