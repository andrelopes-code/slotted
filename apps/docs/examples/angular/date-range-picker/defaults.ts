import { Component } from '@angular/core';
import {
  provideDateRangePickerDefaults,
  SlDateRangePicker,
} from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-defaults',
  imports: [SlDateRangePicker, SlField, SlFieldLabel, SlStack],
  providers: [provideDateRangePickerDefaults({ count: 'nights', months: 1, variant: 'subtle' })],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Lisbon hotel</label>
        <div slDateRangePicker [defaultValue]="lisbon"></div>
      </div>
      <div slField>
        <label slFieldLabel>Porto hotel</label>
        <div slDateRangePicker [defaultValue]="porto"></div>
      </div>
    </div>
  `,
})
export class DateRangePickerDefaults {
  protected readonly lisbon = { start: plainDate(2026, 11, 9), end: plainDate(2026, 11, 12) };
  protected readonly porto = { start: plainDate(2026, 11, 12), end: plainDate(2026, 11, 14) };
}
