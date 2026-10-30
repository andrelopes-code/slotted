import { Component } from '@angular/core';
import {
  SlDateRangePicker,
  SlDateRangePickerPreset,
  SlDateRangePickerPresets,
  type DateRange,
} from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, plainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

const LAST_30_DAYS: DateRange = { start: addDays(TODAY, -29), end: TODAY };

const PRESETS: { label: string; range: DateRange }[] = [
  { label: 'Last 7 days', range: { start: addDays(TODAY, -6), end: TODAY } },
  { label: 'Last 30 days', range: LAST_30_DAYS },
  { label: 'This quarter', range: { start: plainDate(2026, 7, 1), end: TODAY } },
  { label: 'Last quarter', range: { start: plainDate(2026, 4, 1), end: plainDate(2026, 6, 30) } },
  { label: 'Year to date', range: { start: plainDate(2026, 1, 1), end: TODAY } },
];

@Component({
  selector: 'app-date-range-picker-presets',
  imports: [
    SlDateRangePicker,
    SlDateRangePickerPreset,
    SlDateRangePickerPresets,
    SlField,
    SlFieldLabel,
  ],
  template: `
    <div slField>
      <label slFieldLabel>Report period</label>
      <div slDateRangePicker [defaultValue]="last30Days" [max]="today">
        <div slDateRangePickerPresets>
          @for (preset of presets; track preset.label) {
            <button [slDateRangePickerPreset]="preset.range">{{ preset.label }}</button>
          }
        </div>
      </div>
    </div>
  `,
})
export class DateRangePickerPresets {
  protected readonly today = TODAY;
  protected readonly last30Days = LAST_30_DAYS;
  protected readonly presets = PRESETS;
}
