import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-grid-span',
  imports: [SlField, SlFieldLabel, SlGrid, SlTextField, SlTextFieldInput],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="sm">
      <div slField style="grid-column: 1 / -1">
        <label slFieldLabel>Company</label>
        <div slTextField>
          <input slTextFieldInput value="Northwind Traders" />
        </div>
      </div>

      <div slField>
        <label slFieldLabel>Contact</label>
        <div slTextField>
          <input slTextFieldInput value="Priya Raman" />
        </div>
      </div>

      <div slField>
        <label slFieldLabel>Phone</label>
        <div slTextField>
          <input slTextFieldInput value="+31 10 555 0142" />
        </div>
      </div>

      <div slField>
        <label slFieldLabel>City</label>
        <div slTextField>
          <input slTextFieldInput value="Rotterdam" />
        </div>
      </div>

      <div slField>
        <label slFieldLabel>Postal code</label>
        <div slTextField>
          <input slTextFieldInput value="3011 AB" />
        </div>
      </div>
    </div>
  `,
})
export class GridSpan {}
