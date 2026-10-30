import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-orientation',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioGroup],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Report period</legend>
      <div slRadioGroup orientation="horizontal" defaultValue="month">
        <div slRadio value="day">Day</div>
        <div slRadio value="week">Week</div>
        <div slRadio value="month">Month</div>
        <div slRadio value="quarter">Quarter</div>
        <div slRadio value="year">Year</div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupOrientation {}
