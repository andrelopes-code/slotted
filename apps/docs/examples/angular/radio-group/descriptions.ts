import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioDescription, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-descriptions',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioDescription, SlRadioGroup],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Billing cycle</legend>
      <div slRadioGroup defaultValue="monthly">
        <div slRadio value="monthly">
          Monthly
          <p slRadioDescription>Billed on the 5th of each month. Cancel any time.</p>
        </div>
        <div slRadio value="yearly">
          Yearly
          <p slRadioDescription>Two months free, billed once when you subscribe.</p>
        </div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupDescriptions {}
