import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-basic',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlTextField, SlTextFieldInput],
  template: `
    <div slField required>
      <label slFieldLabel>Company name</label>
      <div slTextField clearable>
        <input slTextFieldInput autocomplete="organization" defaultValue="Northwind Traders" />
      </div>
      <span slFieldDescription>Printed on every invoice and packing slip.</span>
    </div>
  `,
})
export class TextFieldBasic {}
