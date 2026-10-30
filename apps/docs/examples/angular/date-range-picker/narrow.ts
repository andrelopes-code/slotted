import { Component } from '@angular/core';
import {
  SlDateRangePicker,
  SlDateRangePickerPreset,
  SlDateRangePickerPresets,
} from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, plainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

@Component({
  selector: 'app-date-range-picker-narrow',
  imports: [
    SlDateRangePicker,
    SlDateRangePickerPreset,
    SlDateRangePickerPresets,
    SlField,
    SlFieldLabel,
  ],
  template: `
    <div slField>
      <label slFieldLabel>Deliveries between</label>
      <div slDateRangePicker [max]="today">
        <div slDateRangePickerPresets>
          <button [slDateRangePickerPreset]="todayOnly">Today</button>
          <button [slDateRangePickerPreset]="lastWeek">Last 7 days</button>
        </div>
      </div>
    </div>
  `,
})
export class DateRangePickerNarrow {
  protected readonly today = TODAY;
  protected readonly todayOnly = { start: TODAY, end: TODAY };
  protected readonly lastWeek = { start: addDays(TODAY, -6), end: TODAY };
}
