import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { dayOfWeek, plainDate, toISODate, type PlainDate } from '@slotted/core/date';

/** Columbus Day, Veterans Day, Thanksgiving and Christmas Day, 2026. */
const HOLIDAYS = new Set(['2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);

const isClosed = (date: PlainDate) =>
  dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || HOLIDAYS.has(toISODate(date));

@Component({
  selector: 'app-date-picker-unavailable',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Pickup date</label>
      <div slDatePicker [defaultValue]="pickup" [isDateUnavailable]="isClosed"></div>
      <span slFieldDescription>The Reno dock is closed on weekends and federal holidays.</span>
    </div>
  `,
})
export class DatePickerUnavailable {
  protected readonly pickup = plainDate(2026, 10, 13);
  protected readonly isClosed = isClosed;
}
