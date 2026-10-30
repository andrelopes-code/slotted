import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-sizes',
  imports: [SlDateTimePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Created after</label>
        <div slDateTimePicker size="sm" [defaultValue]="created"></div>
      </div>
      <div slField>
        <label slFieldLabel>Pickup</label>
        <div slDateTimePicker size="md" [defaultValue]="pickup"></div>
      </div>
      <div slField>
        <label slFieldLabel>Store opening</label>
        <div slDateTimePicker size="lg" [defaultValue]="opening"></div>
      </div>
    </div>
  `,
})
export class DateTimePickerSizes {
  protected readonly created = plainDateTime(plainDate(2026, 9, 1), plainTime(0, 0));
  protected readonly pickup = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
  protected readonly opening = plainDateTime(plainDate(2026, 11, 2), plainTime(10, 0));
}
