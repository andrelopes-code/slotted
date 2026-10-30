import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-months',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Promotion window</label>
      <div slDateRangePicker [defaultValue]="promotion" [months]="1"></div>
      <span slFieldDescription>Promotions run inside one month.</span>
    </div>
  `,
})
export class DateRangePickerMonths {
  protected readonly promotion = { start: plainDate(2026, 10, 5), end: plainDate(2026, 10, 18) };
}
