import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-count',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Hotel stay</label>
        <div slDateRangePicker count="nights" [defaultValue]="trip"></div>
        <span slFieldDescription>Counted in nights: October 12 to 16 is 4 nights.</span>
      </div>
      <div slField>
        <label slFieldLabel>Trade show leave</label>
        <div slDateRangePicker count="days" [defaultValue]="trip"></div>
        <span slFieldDescription>Counted in days: October 12 to 16 is 5 days.</span>
      </div>
    </div>
  `,
})
export class DateRangePickerCount {
  protected readonly trip = { start: plainDate(2026, 10, 12), end: plainDate(2026, 10, 16) };
}
