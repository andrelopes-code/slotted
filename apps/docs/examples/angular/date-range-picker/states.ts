import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-states',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField invalid required>
        <label slFieldLabel>Campaign dates</label>
        <div slDateRangePicker [defaultValue]="campaign"></div>
        <span slFieldError>The end date is before the start date.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Fiscal quarter</label>
        <div slDateRangePicker [defaultValue]="quarter"></div>
        <span slFieldDescription>Set by finance when the quarter opens.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Price freeze</label>
        <div slDateRangePicker [defaultValue]="freeze"></div>
        <span slFieldDescription>Unlocks once the pricing review is approved.</span>
      </div>
    </div>
  `,
})
export class DateRangePickerStates {
  protected readonly campaign = { start: plainDate(2026, 10, 12), end: plainDate(2026, 10, 5) };
  protected readonly quarter = { start: plainDate(2026, 7, 1), end: plainDate(2026, 9, 30) };
  protected readonly freeze = { start: plainDate(2026, 11, 23), end: plainDate(2026, 12, 31) };
}
