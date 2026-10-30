import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-clearable',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Order date</label>
      <div slDateRangePicker clearable [defaultValue]="ordered"></div>
      <span slFieldDescription>Clear the dates to list orders from any date.</span>
    </div>
  `,
})
export class DateRangePickerClearable {
  protected readonly ordered = { start: plainDate(2026, 9, 14), end: plainDate(2026, 9, 27) };
}
