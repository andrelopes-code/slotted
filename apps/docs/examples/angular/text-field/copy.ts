import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-copy',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Invite link</label>
        <div slTextField copyable>
          <input
            slTextFieldInput
            readonly
            defaultValue="https://northwind.slotted.app/join/8f3a2c"
          />
        </div>
        <span slFieldDescription>Anyone with the link joins as a viewer.</span>
      </div>
      <div slField>
        <label slFieldLabel>Webhook signing secret</label>
        <div slTextField copyable mono>
          <input slTextFieldInput readonly defaultValue="whsec_4f9c2a7e1b8d6350" />
        </div>
      </div>
    </div>
  `,
})
export class TextFieldCopy {}
