import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-basic',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Pickup date and time</label>
      <div slDateTimePicker name="pickupAt" [referenceDateTime]="firstPickup"></div>
      <span slFieldDescription>
        Type the date and time, or choose them from the calendar and the list.
      </span>
    </div>
  `,
})
export class DateTimePickerBasic {
  protected readonly firstPickup = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
}
