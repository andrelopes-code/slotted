import { Component } from '@angular/core';
import { SlDatePicker, SlDatePickerFooter } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-footer',
  imports: [SlDatePicker, SlDatePickerFooter, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Stock count date</label>
      <div slDatePicker confirm [defaultValue]="count">
        <span slDatePickerFooter>The warehouse closes at noon</span>
      </div>
      <span slFieldDescription>The date changes when you press Apply.</span>
    </div>
  `,
})
export class DatePickerFooter {
  protected readonly count = plainDate(2026, 10, 3);
}
