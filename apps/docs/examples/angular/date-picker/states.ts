import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-states',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField invalid required>
        <label slFieldLabel>Delivery date</label>
        <div slDatePicker [defaultValue]="delivery"></div>
        <span slFieldError>The delivery date is before the order date, September 30, 2026.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Order date</label>
        <div slDatePicker [defaultValue]="ordered"></div>
        <span slFieldDescription>Set when the order was placed.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Return by</label>
        <div slDatePicker [defaultValue]="returnBy"></div>
        <span slFieldDescription>Returns open once the order is delivered.</span>
      </div>
    </div>
  `,
})
export class DatePickerStates {
  protected readonly delivery = plainDate(2026, 9, 28);
  protected readonly ordered = plainDate(2026, 9, 30);
  protected readonly returnBy = plainDate(2026, 10, 30);
}
