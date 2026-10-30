import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-variants',
  imports: [SlDateRangePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Outline</label>
        <div slDateRangePicker variant="outline" [defaultValue]="quarter"></div>
      </div>
      <div slField>
        <label slFieldLabel>Subtle</label>
        <div slDateRangePicker variant="subtle" [defaultValue]="quarter"></div>
      </div>
      <div slField>
        <label slFieldLabel>Plain</label>
        <div slDateRangePicker variant="plain" [defaultValue]="quarter"></div>
      </div>
    </div>
  `,
})
export class DateRangePickerVariants {
  protected readonly quarter = { start: plainDate(2026, 7, 1), end: plainDate(2026, 9, 30) };
}
