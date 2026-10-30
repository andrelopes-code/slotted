import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-narrow',
  imports: [SlField, SlFieldLabel, SlGrid, SlTextField, SlTextFieldInput],
  template: `
    <div slGrid [columns]="2" minItemWidth="xs" [gap]="4">
      <div slField labelPlacement="side">
        <label slFieldLabel>City</label>
        <div slTextField><input slTextFieldInput defaultValue="Seattle" /></div>
      </div>
      <div slField labelPlacement="side">
        <label slFieldLabel>Postal code</label>
        <div slTextField><input slTextFieldInput defaultValue="98104" /></div>
      </div>
    </div>
  `,
})
export class FieldNarrow {}
