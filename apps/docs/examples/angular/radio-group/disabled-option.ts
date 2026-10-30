import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioDescription, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-disabled-option',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioDescription, SlRadioGroup],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Carrier</legend>
      <div slRadioGroup defaultValue="ups">
        <div slRadio value="ups">UPS Ground</div>
        <div slRadio value="fedex">FedEx 2Day</div>
        <div slRadio value="dhl" disabled>
          DHL Express
          <p slRadioDescription>Does not deliver to Anchorage, AK.</p>
        </div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupDisabledOption {}
