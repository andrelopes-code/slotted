import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, plainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

@Component({
  selector: 'app-date-range-picker-narrow',
  imports: [SlDateRangePicker, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Deliveries between</label>
      <div slDateRangePicker [max]="today" [presets]="presets"></div>
    </div>
  `,
})
export class DateRangePickerNarrow {
  protected readonly today = TODAY;
  protected readonly presets = [
    { label: 'Today', value: { start: TODAY, end: TODAY } },
    { label: 'Last 7 days', value: { start: addDays(TODAY, -6), end: TODAY } },
  ];
}
