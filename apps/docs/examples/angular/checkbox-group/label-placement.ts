import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-group-label-placement',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Email reports</legend>
      <div slCheckboxGroup labelPlacement="start" [defaultValue]="['weekly']">
        <div slCheckbox value="daily">Daily sales summary</div>
        <div slCheckbox value="weekly">Weekly stock report</div>
        <div slCheckbox value="monthly">Monthly statement</div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupLabelPlacement {}
