import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-first-day',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Shift starts</label>
      <div slDatePicker locale="en-US" [defaultValue]="shift" [firstDayOfWeek]="1"></div>
      <span slFieldDescription>Rosters run Monday to Sunday.</span>
    </div>
  `,
})
export class DatePickerFirstDay {
  protected readonly shift = plainDate(2026, 9, 30);
}
