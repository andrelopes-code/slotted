import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-bounds',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Container collection</label>
      <div
        slDateTimePicker
        [defaultValue]="opens"
        [max]="closes"
        [maxTime]="dayEnds"
        [min]="opens"
        [minTime]="dayStarts"
        [step]="3600"
      ></div>
      <span slFieldDescription>
        From October 1 at 1:00 PM to October 9 at 12:00 PM, between 8:00 AM and 5:00 PM.
      </span>
    </div>
  `,
})
export class DateTimePickerBounds {
  protected readonly opens = plainDateTime(plainDate(2026, 10, 1), plainTime(13, 0));
  protected readonly closes = plainDateTime(plainDate(2026, 10, 9), plainTime(12, 0));
  protected readonly dayStarts = plainTime(8, 0);
  protected readonly dayEnds = plainTime(17, 0);
}
