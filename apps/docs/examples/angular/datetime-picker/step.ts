import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-step',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Dock appointment</label>
      <div
        slDateTimePicker
        [maxTime]="lastStart"
        [minTime]="firstStart"
        [referenceDateTime]="reference"
        [step]="1800"
      ></div>
      <span slFieldDescription>Appointments start every 30 minutes from 7:15 AM.</span>
    </div>
  `,
})
export class DateTimePickerStep {
  protected readonly firstStart = plainTime(7, 15);
  protected readonly lastStart = plainTime(16, 45);
  protected readonly reference = plainDateTime(plainDate(2026, 9, 30), plainTime(7, 15));
}
