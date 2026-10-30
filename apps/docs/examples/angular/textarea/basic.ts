import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-basic',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlTextarea],
  template: `
    <div slField>
      <label slFieldLabel>Delivery instructions</label>
      <textarea slTextarea placeholder="Gate code, loading dock, opening hours"></textarea>
      <span slFieldDescription>Printed on the packing slip for the carrier.</span>
    </div>
  `,
})
export class TextareaBasic {}
