import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-options',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Line-haul departure</label>
      <div slDateTimePicker [options]="departures" [referenceDateTime]="reference"></div>
      <span slFieldDescription>The Chicago to Memphis trailer leaves five times a day.</span>
    </div>
  `,
})
export class DateTimePickerOptions {
  protected readonly departures = [
    plainTime(5, 40),
    plainTime(8, 15),
    plainTime(11, 50),
    plainTime(16, 5),
    plainTime(21, 30),
  ];
  protected readonly reference = plainDateTime(plainDate(2026, 9, 30), plainTime(8, 15));
}
