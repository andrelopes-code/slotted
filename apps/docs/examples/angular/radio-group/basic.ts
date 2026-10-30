import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-basic',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioGroup],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Delivery speed</legend>
      <div slRadioGroup name="delivery" defaultValue="standard">
        <div slRadio value="standard">Standard, 3 to 5 business days</div>
        <div slRadio value="express">Express, next business day</div>
        <div slRadio value="same-day">Same day, Seattle only</div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupBasic {}
