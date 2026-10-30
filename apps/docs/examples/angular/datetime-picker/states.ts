import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-states',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField invalid required>
        <label slFieldLabel>Pickup</label>
        <div slDateTimePicker [defaultValue]="early"></div>
        <span slFieldError
          >The pickup is before the order was placed, September 30 at 9:00 AM.</span
        >
      </div>
      <div slField readOnly>
        <label slFieldLabel>Order placed</label>
        <div slDateTimePicker [defaultValue]="placed"></div>
        <span slFieldDescription>Set when the order was placed.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Delivered</label>
        <div slDateTimePicker></div>
        <span slFieldDescription>Filled in by the carrier on delivery.</span>
      </div>
    </div>
  `,
})
export class DateTimePickerStates {
  protected readonly early = plainDateTime(plainDate(2026, 9, 29), plainTime(16, 0));
  protected readonly placed = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
}
