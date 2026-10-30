import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-radio-group-sizes',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioGroup, SlStack],
  template: `
    <div slStack [gap]="5">
      <fieldset slFieldGroup size="sm">
        <legend slFieldGroupLegend>Count by</legend>
        <div slRadioGroup orientation="horizontal" defaultValue="cases">
          <div slRadio value="cases">Cases</div>
          <div slRadio value="units">Units</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup size="md">
        <legend slFieldGroupLegend>Payment terms</legend>
        <div slRadioGroup orientation="horizontal" defaultValue="net-30">
          <div slRadio value="net-30">Net 30</div>
          <div slRadio value="net-60">Net 60</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup size="lg">
        <legend slFieldGroupLegend>Account type</legend>
        <div slRadioGroup orientation="horizontal" defaultValue="business">
          <div slRadio value="business">Business</div>
          <div slRadio value="personal">Personal</div>
        </div>
      </fieldset>
    </div>
  `,
})
export class RadioGroupSizes {}
