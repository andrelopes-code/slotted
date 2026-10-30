import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-states',
  imports: [SlCheckbox, SlCheckboxDescription, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCheckbox readOnly defaultChecked>
        Tax exempt
        <p slCheckboxDescription>Set by the customer's tax certificate.</p>
      </div>
      <div slCheckbox disabled>
        Same-day delivery
        <p slCheckboxDescription>Not offered from the Seattle warehouse.</p>
      </div>
      <div slCheckbox invalid>
        I counted every item on shelf A-14
        <p slCheckboxDescription>Confirm the count before closing the cycle.</p>
      </div>
    </div>
  `,
})
export class CheckboxStates {}
