import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-states',
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
      <div slField invalid required>
        <label slFieldLabel>Card number</label>
        <div slTextField>
          <input slTextFieldInput inputmode="numeric" defaultValue="4242 4242 42" />
        </div>
        <span slFieldError>Six digits are missing.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Account ID</label>
        <div slTextField><input slTextFieldInput defaultValue="acct_9f2c41" /></div>
        <span slFieldDescription>Quote this ID when you contact support.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Workspace URL</label>
        <div slTextField><input slTextFieldInput defaultValue="northwind.slotted.app" /></div>
        <span slFieldDescription>Only the workspace owner can change the URL.</span>
      </div>
    </div>
  `,
})
export class FieldStates {}
