import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-group-parent',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Columns to export</legend>
      <div
        slCheckboxGroup
        name="columns"
        [allValues]="columns"
        [defaultValue]="['order', 'customer', 'total']"
      >
        <div slCheckbox parent>All columns</div>
        <div slCheckbox value="order">Order number</div>
        <div slCheckbox value="customer">Customer</div>
        <div slCheckbox value="placed">Placed on</div>
        <div slCheckbox value="total">Total</div>
        <div slCheckbox value="status">Status</div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupParent {
  readonly columns = ['order', 'customer', 'placed', 'total', 'status'];
}
