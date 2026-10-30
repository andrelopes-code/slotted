import { Component } from '@angular/core';
import { SlField, SlFieldControl, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

@Component({
  selector: 'app-field-custom-control',
  imports: [SlField, SlFieldControl, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Brand color</label>
      <input slFieldControl type="color" value="#2f6fde" />
      <span slFieldDescription>Used on invoices and in the customer portal.</span>
    </div>
  `,
})
export class FieldCustomControl {}
