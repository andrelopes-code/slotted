import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-sizes',
  imports: [SlDateRangePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Created between</label>
        <div slDateRangePicker size="sm" [defaultValue]="created"></div>
      </div>
      <div slField>
        <label slFieldLabel>Billing period</label>
        <div slDateRangePicker size="md" [defaultValue]="billing"></div>
      </div>
      <div slField>
        <label slFieldLabel>Lease term</label>
        <div slDateRangePicker size="lg" [defaultValue]="lease"></div>
      </div>
    </div>
  `,
})
export class DateRangePickerSizes {
  protected readonly created = { start: plainDate(2026, 9, 1), end: plainDate(2026, 9, 30) };
  protected readonly billing = { start: plainDate(2026, 10, 1), end: plainDate(2026, 10, 31) };
  protected readonly lease = { start: plainDate(2026, 11, 1), end: plainDate(2027, 10, 31) };
}
