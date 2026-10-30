import { Component } from '@angular/core';
import { SlField, SlFieldHeader, SlFieldHelp, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-help',
  imports: [
    SlField,
    SlFieldHeader,
    SlFieldHelp,
    SlFieldLabel,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField required>
        <div slFieldHeader>
          <label slFieldLabel>Cost centre</label>
          <button
            slFieldHelp="The four-digit code finance assigns to your team. It appears on every invoice line."
          ></button>
        </div>
        <div slTextField><input slTextFieldInput inputmode="numeric" defaultValue="4120" /></div>
      </div>
      <div slField disabled>
        <div slFieldHeader>
          <label slFieldLabel>Billing currency</label>
          <button
            slFieldHelp="Set when the workspace was created. Contact support to change it."
          ></button>
        </div>
        <div slTextField><input slTextFieldInput defaultValue="USD — US dollar" /></div>
      </div>
    </div>
  `,
})
export class FieldHelp {}
