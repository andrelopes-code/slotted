import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-parent',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Delivery days</legend>
      <div
        slCheckboxGroup
        [allValues]="weekdays"
        [defaultValue]="['mon', 'wed', 'fri']"
        name="days"
      >
        <div slCheckbox parent>Every weekday</div>
        <div slCheckbox value="mon">Monday</div>
        <div slCheckbox value="tue">Tuesday</div>
        <div slCheckbox value="wed">Wednesday</div>
        <div slCheckbox value="thu">Thursday</div>
        <div slCheckbox value="fri">Friday</div>
      </div>
    </fieldset>
  `,
})
export class CheckboxParent {
  readonly weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
}
