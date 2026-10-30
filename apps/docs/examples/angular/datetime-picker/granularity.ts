import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-granularity',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Shift starts</label>
        <div slDateTimePicker granularity="hour" [defaultValue]="shift" [step]="3600"></div>
        <span slFieldDescription>Shifts start on the hour.</span>
      </div>
      <div slField>
        <label slFieldLabel>Batch run starts</label>
        <div
          slDateTimePicker
          granularity="second"
          [defaultValue]="batch"
          [maxTime]="windowEnd"
          [minTime]="windowStart"
          [step]="30"
        ></div>
        <span slFieldDescription>The nightly run starts between 2:00:00 and 2:05:00 AM.</span>
      </div>
    </div>
  `,
})
export class DateTimePickerGranularity {
  protected readonly shift = plainDateTime(plainDate(2026, 10, 1), plainTime(6, 0));
  protected readonly batch = plainDateTime(plainDate(2026, 9, 30), plainTime(2, 0, 30));
  protected readonly windowStart = plainTime(2, 0);
  protected readonly windowEnd = plainTime(2, 5);
}
