import { Component } from '@angular/core';
import {
  SlFieldGroup,
  SlFieldGroupDescription,
  SlFieldGroupError,
  SlFieldGroupLegend,
} from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-radio-group-states',
  imports: [
    SlFieldGroup,
    SlFieldGroupDescription,
    SlFieldGroupError,
    SlFieldGroupLegend,
    SlRadio,
    SlRadioGroup,
    SlStack,
  ],
  template: `
    <div slStack [gap]="6">
      <fieldset slFieldGroup required>
        <legend slFieldGroupLegend>Payment terms</legend>
        <span slFieldGroupError>Choose the payment terms for this customer.</span>
        <div slRadioGroup invalid orientation="horizontal">
          <div slRadio value="net-30">Net 30</div>
          <div slRadio value="net-60">Net 60</div>
          <div slRadio value="prepaid">Prepaid</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup readOnly>
        <legend slFieldGroupLegend>Warehouse</legend>
        <span slFieldGroupDescription>Stock is reserved once the order is picked.</span>
        <div slRadioGroup orientation="horizontal" defaultValue="seattle">
          <div slRadio value="seattle">Seattle</div>
          <div slRadio value="tacoma">Tacoma</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup disabled>
        <legend slFieldGroupLegend>Return method</legend>
        <span slFieldGroupDescription>Returns open when the order is delivered.</span>
        <div slRadioGroup orientation="horizontal" defaultValue="drop-off">
          <div slRadio value="drop-off">Drop-off</div>
          <div slRadio value="pickup">Pickup</div>
        </div>
      </fieldset>
    </div>
  `,
})
export class RadioGroupStates {}
