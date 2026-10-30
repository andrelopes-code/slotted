import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateTimePicker, SlDateTimePickerFooter } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-footer',
  imports: [
    SlButton,
    SlDateTimePicker,
    SlDateTimePickerFooter,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
  ],
  template: `
    <div slField>
      <label slFieldLabel>Maintenance window starts</label>
      <div
        slDateTimePicker
        #picker="slDateTimePicker"
        closeOnSelect="never"
        [defaultValue]="start"
        [step]="3600"
      >
        <div slDateTimePickerFooter>
          <button slButton size="sm" type="button" (click)="picker.closeSurface()">Done</button>
        </div>
      </div>
      <span slFieldDescription>Conveyors stop for four hours from this time.</span>
    </div>
  `,
})
export class DateTimePickerFooter {
  protected readonly start = plainDateTime(plainDate(2026, 10, 3), plainTime(22, 0));
}
