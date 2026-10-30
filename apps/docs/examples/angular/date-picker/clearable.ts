import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-clearable',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Hold shipment until</label>
      <div slDatePicker clearable [defaultValue]="holdUntil"></div>
      <span slFieldDescription>Clear the date to release the shipment.</span>
    </div>
  `,
})
export class DatePickerClearable {
  protected readonly holdUntil = plainDate(2026, 10, 9);
}
