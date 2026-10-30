import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import {
  SlFieldGroup,
  SlFieldGroupDescription,
  SlFieldGroupError,
  SlFieldGroupLegend,
} from '@slotted/angular/field-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-group-states',
  imports: [
    SlCheckbox,
    SlCheckboxGroup,
    SlFieldGroup,
    SlFieldGroupDescription,
    SlFieldGroupError,
    SlFieldGroupLegend,
    SlStack,
  ],
  template: `
    <div slStack [gap]="6">
      <fieldset slFieldGroup required>
        <legend slFieldGroupLegend>Sales regions</legend>
        <span slFieldGroupError>Choose at least one region for this price list.</span>
        <div slCheckboxGroup invalid orientation="horizontal">
          <div slCheckbox value="us">United States</div>
          <div slCheckbox value="ca">Canada</div>
          <div slCheckbox value="eu">European Union</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup readOnly>
        <legend slFieldGroupLegend>Tax exemptions</legend>
        <span slFieldGroupDescription>Set by the finance team on the customer record.</span>
        <div slCheckboxGroup orientation="horizontal" [defaultValue]="['resale']">
          <div slCheckbox value="resale">Resale</div>
          <div slCheckbox value="nonprofit">Nonprofit</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup disabled>
        <legend slFieldGroupLegend>Carriers</legend>
        <span slFieldGroupDescription>Carriers open once a ship-from address is saved.</span>
        <div slCheckboxGroup orientation="horizontal" [defaultValue]="['ups']">
          <div slCheckbox value="ups">UPS</div>
          <div slCheckbox value="fedex">FedEx</div>
          <div slCheckbox value="usps">USPS</div>
        </div>
      </fieldset>
    </div>
  `,
})
export class CheckboxGroupStates {}
