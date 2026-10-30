import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateRangePicker, SlDateRangePickerFooter } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-footer',
  imports: [
    SlButton,
    SlDateRangePicker,
    SlDateRangePickerFooter,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
  ],
  template: `
    <div slField>
      <label slFieldLabel>Stock count freeze</label>
      <div
        slDateRangePicker
        #picker="slDateRangePicker"
        closeOnSelect="never"
        [defaultValue]="freeze"
      >
        <div slDateRangePickerFooter>
          <button slButton size="sm" type="button" (click)="picker.closeSurface()">Done</button>
        </div>
      </div>
      <span slFieldDescription>The calendar stays open until you press Done.</span>
    </div>
  `,
})
export class DateRangePickerFooter {
  protected readonly freeze = { start: plainDate(2026, 10, 30), end: plainDate(2026, 11, 1) };
}
