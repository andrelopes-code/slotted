import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-group-basic',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Notify me about failed payments by</legend>
      <div slCheckboxGroup name="channels" [defaultValue]="['email', 'in-app']">
        <div slCheckbox value="email">Email</div>
        <div slCheckbox value="sms">Text message</div>
        <div slCheckbox value="in-app">In-app notification</div>
        <div slCheckbox value="slack">Slack, #billing-alerts</div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupBasic {}
