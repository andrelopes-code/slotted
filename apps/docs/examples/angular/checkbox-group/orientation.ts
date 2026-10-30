import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-group-orientation',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Invoice status</legend>
      <div slCheckboxGroup orientation="horizontal" [defaultValue]="['open', 'overdue']">
        <div slCheckbox value="draft">Draft</div>
        <div slCheckbox value="open">Open</div>
        <div slCheckbox value="paid">Paid</div>
        <div slCheckbox value="overdue">Overdue</div>
        <div slCheckbox value="void">Void</div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupOrientation {}
