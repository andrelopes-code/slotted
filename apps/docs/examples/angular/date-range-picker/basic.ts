import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

@Component({
  selector: 'app-date-range-picker-basic',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Reporting period</label>
      <div slDateRangePicker startName="periodStart" endName="periodEnd"></div>
      <span slFieldDescription>Type both dates or choose them from the calendar.</span>
    </div>
  `,
})
export class DateRangePickerBasic {}
