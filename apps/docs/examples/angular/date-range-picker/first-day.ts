import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-first-day',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Sprint 42</label>
      <div slDateRangePicker weekNumbers [defaultValue]="sprint" [firstDayOfWeek]="1"></div>
      <span slFieldDescription>Sprints run two ISO weeks, Monday to Friday.</span>
    </div>
  `,
})
export class DateRangePickerFirstDay {
  protected readonly sprint = { start: plainDate(2026, 10, 5), end: plainDate(2026, 10, 16) };
}
