import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-sizes',
  imports: [SlDatePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Shipped after</label>
        <div slDatePicker size="sm" [defaultValue]="shippedAfter"></div>
      </div>
      <div slField>
        <label slFieldLabel>Ship date</label>
        <div slDatePicker size="md" [defaultValue]="shipDate"></div>
      </div>
      <div slField>
        <label slFieldLabel>Move-in date</label>
        <div slDatePicker size="lg" [defaultValue]="moveIn"></div>
      </div>
    </div>
  `,
})
export class DatePickerSizes {
  protected readonly shippedAfter = plainDate(2026, 9, 1);
  protected readonly shipDate = plainDate(2026, 9, 30);
  protected readonly moveIn = plainDate(2026, 11, 2);
}
