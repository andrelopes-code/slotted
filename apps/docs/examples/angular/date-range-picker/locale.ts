import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-locale',
  imports: [SlDateRangePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Peak season, United States (en-US)</label>
        <div slDateRangePicker locale="en-US" [defaultValue]="season"></div>
      </div>
      <div slField>
        <label slFieldLabel>Peak season, United Kingdom (en-GB)</label>
        <div slDateRangePicker locale="en-GB" [defaultValue]="season"></div>
      </div>
      <div slField>
        <label slFieldLabel>Peak season, Germany (de-DE)</label>
        <div slDateRangePicker locale="de-DE" [defaultValue]="season"></div>
      </div>
    </div>
  `,
})
export class DateRangePickerLocale {
  protected readonly season = { start: plainDate(2026, 11, 2), end: plainDate(2026, 12, 23) };
}
