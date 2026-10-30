import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  dayOfWeek,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDate,
  type PlainTime,
} from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-unavailable',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Warehouse inspection</label>
      <div
        slDateTimePicker
        [isDateUnavailable]="isWeekend"
        [isTimeUnavailable]="isLunch"
        [maxTime]="dayEnds"
        [minTime]="dayStarts"
        [referenceDateTime]="reference"
        [step]="1800"
      ></div>
      <span slFieldDescription>Weekdays from 8:00 AM to 5:00 PM, closed for lunch at noon.</span>
    </div>
  `,
})
export class DateTimePickerUnavailable {
  protected readonly dayStarts = plainTime(8, 0);
  protected readonly dayEnds = plainTime(17, 0);
  protected readonly reference = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
  protected readonly isWeekend = (date: PlainDate) =>
    dayOfWeek(date) === 0 || dayOfWeek(date) === 6;
  protected readonly isLunch = (time: PlainTime) => time.hour === 12;
}
