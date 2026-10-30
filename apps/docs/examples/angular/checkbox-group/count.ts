import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

@Component({
  selector: 'app-checkbox-group-count',
  imports: [SlCheckbox, SlCheckboxGroup, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Fulfil from</label>
      <div
        slCheckboxGroup
        name="warehouses"
        showCount
        [allValues]="warehouses"
        [defaultValue]="['seattle', 'tacoma']"
      >
        <div slCheckbox value="seattle">Seattle</div>
        <div slCheckbox value="tacoma">Tacoma</div>
        <div slCheckbox value="portland">Portland</div>
        <div slCheckbox value="boise">Boise</div>
      </div>
      <span slFieldDescription>Orders ship from the nearest selected warehouse.</span>
    </div>
  `,
})
export class CheckboxGroupCount {
  readonly warehouses = ['seattle', 'tacoma', 'portland', 'boise'];
}
