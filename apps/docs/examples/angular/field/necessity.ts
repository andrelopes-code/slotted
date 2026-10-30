import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-necessity',
  imports: [SlField, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="5">
      <div slField required>
        <label slFieldLabel>Company name</label>
        <div slTextField><input slTextFieldInput /></div>
      </div>
      <div slField necessity="optional">
        <label slFieldLabel>Purchase order</label>
        <div slTextField><input slTextFieldInput /></div>
      </div>
      <div slField necessity="words" required>
        <label slFieldLabel>Tax ID</label>
        <div slTextField><input slTextFieldInput /></div>
      </div>
    </div>
  `,
})
export class FieldNecessity {}
