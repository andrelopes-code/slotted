import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { compareDate, plainDate, type PlainDate } from '@slotted/core/date';

const BOOKED_FROM = plainDate(2026, 10, 14);
const BOOKED_TO = plainDate(2026, 10, 16);

const isBooked = (date: PlainDate) =>
  compareDate(date, BOOKED_FROM) >= 0 && compareDate(date, BOOKED_TO) <= 0;

@Component({
  selector: 'app-date-range-picker-unavailable',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Training room</label>
      <div slDateRangePicker [isDateUnavailable]="isBooked"></div>
      <span slFieldDescription>
        Booked October 14 to 16. A booking cannot run across those days.
      </span>
    </div>
  `,
})
export class DateRangePickerUnavailable {
  protected readonly isBooked = isBooked;
}
