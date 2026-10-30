import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDatePicker, SlDatePickerFooter } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-footer',
  imports: [SlButton, SlDatePicker, SlDatePickerFooter, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Stock count date</label>
      <div slDatePicker #picker="slDatePicker" closeOnSelect="never" [defaultValue]="count">
        <div slDatePickerFooter>
          <button slButton size="sm" type="button" (click)="picker.closeSurface()">Done</button>
        </div>
      </div>
      <span slFieldDescription>The calendar stays open until you press Done.</span>
    </div>
  `,
})
export class DatePickerFooter {
  protected readonly count = plainDate(2026, 10, 3);
}
