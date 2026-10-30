import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

@Component({
  selector: 'app-date-picker-basic',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Requested delivery date</label>
      <div slDatePicker name="deliveryDate"></div>
      <span slFieldDescription>Type the date or choose it from the calendar.</span>
    </div>
  `,
})
export class DatePickerBasic {}
