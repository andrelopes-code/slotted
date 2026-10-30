import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-group-disabled-option',
  imports: [SlCheckbox, SlCheckboxDescription, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Send order updates by</legend>
      <div slCheckboxGroup name="updates" [defaultValue]="['email']">
        <div slCheckbox value="email">Email</div>
        <div slCheckbox value="sms" disabled>
          Text message
          <p slCheckboxDescription>Add a mobile number to the customer record to turn this on.</p>
        </div>
        <div slCheckbox value="webhook">Webhook to the storefront</div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupDisabledOption {}
