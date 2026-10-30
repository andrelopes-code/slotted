import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-label-placement',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioGroup],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Send the stock report</legend>
      <div slRadioGroup labelPlacement="start" defaultValue="monday">
        <div slRadio value="daily">Every morning</div>
        <div slRadio value="monday">Every Monday</div>
        <div slRadio value="never">Never</div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupLabelPlacement {}
