import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import {
  provideNumberFieldDefaults,
  SlNumberField,
  SlNumberFieldInput,
} from '@slotted/angular/number-field';

@Component({
  selector: 'app-number-field-defaults',
  imports: [SlField, SlFieldLabel, SlGrid, SlNumberField, SlNumberFieldInput],
  providers: [provideNumberFieldDefaults({ size: 'sm', stepper: 'split', variant: 'subtle' })],
  template: `
    <div slGrid [gap]="3" minItemWidth="xs">
      <div slField>
        <label slFieldLabel>Cases</label>
        <div slNumberField><input slNumberFieldInput defaultValue="6" min="0" /></div>
      </div>
      <div slField>
        <label slFieldLabel>Loose units</label>
        <div slNumberField><input slNumberFieldInput defaultValue="11" min="0" /></div>
      </div>
      <div slField>
        <label slFieldLabel>Pallets</label>
        <div slNumberField stepper="stacked">
          <input slNumberFieldInput defaultValue="1" min="0" />
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldDefaults {}
