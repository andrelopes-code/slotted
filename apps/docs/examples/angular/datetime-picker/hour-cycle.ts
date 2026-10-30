import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-hour-cycle',
  imports: [SlDateTimePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Departure, 12-hour clock</label>
        <div slDateTimePicker [defaultValue]="departure" [hourCycle]="12"></div>
      </div>
      <div slField>
        <label slFieldLabel>Departure, 24-hour clock</label>
        <div slDateTimePicker [defaultValue]="departure" [hourCycle]="24"></div>
      </div>
    </div>
  `,
})
export class DateTimePickerHourCycle {
  protected readonly departure = plainDateTime(plainDate(2026, 9, 30), plainTime(18, 45));
}
