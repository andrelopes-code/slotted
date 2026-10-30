import { Component } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import {
  provideTextFieldDefaults,
  SlTextField,
  SlTextFieldInput,
} from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-defaults',
  imports: [SlGrid, SlTextField, SlTextFieldInput],
  providers: [provideTextFieldDefaults({ size: 'sm', variant: 'subtle' })],
  template: `
    <div slGrid [gap]="2" minItemWidth="xs">
      <div slTextField clearable>
        <input slTextFieldInput aria-label="Customer" placeholder="Customer" />
      </div>
      <div slTextField mono>
        <input slTextFieldInput aria-label="Order number" placeholder="Order number" />
      </div>
      <div slTextField>
        <input slTextFieldInput aria-label="Ship to city" placeholder="Ship to city" />
      </div>
    </div>
  `,
})
export class TextFieldDefaults {}
