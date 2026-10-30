import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { dayOfWeek, toISODate, type PlainDate } from '@slotted/core/date';

const HOLIDAYS = new Set(['2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);

const isNonWorkingDay = (date: PlainDate) =>
  dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || HOLIDAYS.has(toISODate(date));

@Component({
  selector: 'app-date-range-picker-across-unavailable',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Vacation</label>
      <div slDateRangePicker [contiguous]="false" [isDateUnavailable]="isNonWorkingDay"></div>
      <span slFieldDescription>
        Start and end on a working day. Weekends and holidays inside the vacation are fine.
      </span>
    </div>
  `,
})
export class DateRangePickerAcrossUnavailable {
  protected readonly isNonWorkingDay = isNonWorkingDay;
}
