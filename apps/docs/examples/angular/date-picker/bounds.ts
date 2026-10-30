import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-bounds',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Delivery window</label>
      <div slDatePicker [defaultValue]="delivery" [max]="last" [min]="first"></div>
      <span slFieldDescription>Carriers book October 2026 only.</span>
    </div>
  `,
})
export class DatePickerBounds {
  protected readonly delivery = plainDate(2026, 10, 15);
  protected readonly first = plainDate(2026, 10, 1);
  protected readonly last = plainDate(2026, 10, 31);
}
