import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { provideCheckboxGroupDefaults, SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-group-defaults',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend, SlStack],
  providers: [provideCheckboxGroupDefaults({ orientation: 'horizontal' })],
  template: `
    <div slStack [gap]="5">
      <fieldset slFieldGroup>
        <legend slFieldGroupLegend>Fulfilment</legend>
        <div slCheckboxGroup [defaultValue]="['unfulfilled', 'partial']">
          <div slCheckbox value="unfulfilled">Unfulfilled</div>
          <div slCheckbox value="partial">Partial</div>
          <div slCheckbox value="fulfilled">Fulfilled</div>
        </div>
      </fieldset>
      <fieldset slFieldGroup>
        <legend slFieldGroupLegend>Sales channel</legend>
        <div slCheckboxGroup [defaultValue]="['online']">
          <div slCheckbox value="online">Online</div>
          <div slCheckbox value="retail">Retail</div>
          <div slCheckbox value="wholesale">Wholesale</div>
        </div>
      </fieldset>
    </div>
  `,
})
export class CheckboxGroupDefaults {}
