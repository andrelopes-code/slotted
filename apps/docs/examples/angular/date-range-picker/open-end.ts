import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-open-end',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Price valid</label>
      <div slDateRangePicker clearable [defaultValue]="validity"></div>
      <span slFieldDescription>Leave the end empty for a price with no end date.</span>
    </div>
  `,
})
export class DateRangePickerOpenEnd {
  protected readonly validity = { start: plainDate(2026, 10, 1), end: null };
}
