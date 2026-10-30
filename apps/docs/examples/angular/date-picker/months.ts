import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-months',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Installation appointment</label>
      <div slDatePicker [defaultValue]="appointment" [months]="2"></div>
      <span slFieldDescription>Technicians book up to eight weeks ahead.</span>
    </div>
  `,
})
export class DatePickerMonths {
  protected readonly appointment = plainDate(2026, 10, 20);
}
