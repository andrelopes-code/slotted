import { Component } from '@angular/core';
import { SlDateRangePicker, SlDateRangePickerFooter } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-footer',
  imports: [SlDateRangePicker, SlDateRangePickerFooter, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Stock count freeze</label>
      <div slDateRangePicker confirm="false" [defaultValue]="freeze">
        <span slDateRangePickerFooter>No shipments leave on these days</span>
      </div>
      <span slFieldDescription>The second press sets the freeze.</span>
    </div>
  `,
})
export class DateRangePickerFooter {
  protected readonly freeze = { start: plainDate(2026, 10, 30), end: plainDate(2026, 11, 1) };
}
