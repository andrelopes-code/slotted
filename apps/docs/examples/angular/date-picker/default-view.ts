import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-default-view',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Date of incorporation</label>
      <div slDatePicker defaultView="year" [max]="today"></div>
      <span slFieldDescription>As printed on the certificate of incorporation.</span>
    </div>
  `,
})
export class DatePickerDefaultView {
  protected readonly today = plainDate(2026, 9, 30);
}
