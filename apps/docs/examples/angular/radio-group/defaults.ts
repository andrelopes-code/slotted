import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { provideRadioGroupDefaults, SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-radio-group-defaults',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioGroup, SlStack],
  providers: [provideRadioGroupDefaults({ orientation: 'horizontal' })],
  template: `
    <div slStack [gap]="5">
      <fieldset slFieldGroup>
        <legend slFieldGroupLegend>Status</legend>
        <div slRadioGroup defaultValue="all">
          <div slRadio value="all">All</div>
          <div slRadio value="open">Open</div>
          <div slRadio value="paid">Paid</div>
          <div slRadio value="overdue">Overdue</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup>
        <legend slFieldGroupLegend>Channel</legend>
        <div slRadioGroup defaultValue="all">
          <div slRadio value="all">All</div>
          <div slRadio value="online">Online</div>
          <div slRadio value="retail">Retail</div>
          <div slRadio value="wholesale">Wholesale</div>
        </div>
      </fieldset>
    </div>
  `,
})
export class RadioGroupDefaults {}
