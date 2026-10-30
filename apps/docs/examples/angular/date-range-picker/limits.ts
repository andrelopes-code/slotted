import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

@Component({
  selector: 'app-date-range-picker-limits',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Forklift rental</label>
      <div slDateRangePicker [minLength]="2" [maxLength]="14"></div>
      <span slFieldDescription>Rentals run from 2 to 14 days.</span>
    </div>
  `,
})
export class DateRangePickerLimits {}
