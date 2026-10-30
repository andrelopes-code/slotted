import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-count',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Email subject</label>
        <div slTextField>
          <input
            slTextFieldInput
            showCount
            maxlength="60"
            defaultValue="Your order SO-2026-00418 has shipped"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>SMS sender name</label>
        <div slTextField>
          <input slTextFieldInput showCount countMax="11" defaultValue="Northwind" />
        </div>
        <span slFieldDescription>Carriers cut sender names after 11 characters.</span>
      </div>
    </div>
  `,
})
export class TextFieldCount {}
