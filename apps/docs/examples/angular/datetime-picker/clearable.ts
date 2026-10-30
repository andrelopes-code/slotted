import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-clearable',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Hold shipment until</label>
      <div slDateTimePicker clearable [defaultValue]="holdUntil"></div>
      <span slFieldDescription>Clear the date and time to release the shipment.</span>
    </div>
  `,
})
export class DateTimePickerClearable {
  protected readonly holdUntil = plainDateTime(plainDate(2026, 10, 9), plainTime(17, 0));
}
