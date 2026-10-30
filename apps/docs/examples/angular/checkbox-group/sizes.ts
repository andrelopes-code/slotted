import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-group-sizes',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend, SlStack],
  template: `
    <div slStack [gap]="5">
      <fieldset slFieldGroup size="sm">
        <legend slFieldGroupLegend>Show columns</legend>
        <div slCheckboxGroup orientation="horizontal" [defaultValue]="['sku', 'on-hand']">
          <div slCheckbox value="sku">SKU</div>
          <div slCheckbox value="on-hand">On hand</div>
          <div slCheckbox value="reserved">Reserved</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup size="md">
        <legend slFieldGroupLegend>Ship from</legend>
        <div slCheckboxGroup orientation="horizontal" [defaultValue]="['seattle']">
          <div slCheckbox value="seattle">Seattle</div>
          <div slCheckbox value="tacoma">Tacoma</div>
          <div slCheckbox value="portland">Portland</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup size="lg">
        <legend slFieldGroupLegend>Accept payment by</legend>
        <div slCheckboxGroup orientation="horizontal" [defaultValue]="['card', 'transfer']">
          <div slCheckbox value="card">Card</div>
          <div slCheckbox value="transfer">Bank transfer</div>
        </div>
      </fieldset>
    </div>
  `,
})
export class CheckboxGroupSizes {}
