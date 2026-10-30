import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-basic',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlTextField, SlTextFieldInput],
  template: `
    <div slField required>
      <label slFieldLabel>Email</label>
      <div slTextField>
        <input slTextFieldInput type="email" autocomplete="email" />
      </div>
      <span slFieldDescription>Invoices are sent to this address.</span>
    </div>
  `,
})
export class FieldBasic {}
