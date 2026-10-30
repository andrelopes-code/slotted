import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-types',
  imports: [SlField, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Work email</label>
        <div slTextField>
          <input
            slTextFieldInput
            type="email"
            autocomplete="email"
            placeholder="name@northwind.com"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Phone</label>
        <div slTextField>
          <input slTextFieldInput type="tel" autocomplete="tel" placeholder="+1 206 555 0134" />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Website</label>
        <div slTextField>
          <input
            slTextFieldInput
            type="url"
            autocomplete="url"
            placeholder="https://northwind.com"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>ZIP code</label>
        <div slTextField>
          <input
            slTextFieldInput
            autocomplete="postal-code"
            inputmode="numeric"
            placeholder="98101"
          />
        </div>
      </div>
    </div>
  `,
})
export class TextFieldTypes {}
