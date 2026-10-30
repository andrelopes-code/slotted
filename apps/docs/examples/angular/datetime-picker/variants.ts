import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-variants',
  imports: [SlDateTimePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Pickup</label>
        <div slDateTimePicker variant="outline" [defaultValue]="pickup"></div>
      </div>
      <div slField>
        <label slFieldLabel>Loading starts</label>
        <div slDateTimePicker variant="subtle" [defaultValue]="pickup"></div>
      </div>
      <div slField>
        <label slFieldLabel>Gate opens</label>
        <div slDateTimePicker variant="plain" [defaultValue]="pickup"></div>
      </div>
    </div>
  `,
})
export class DateTimePickerVariants {
  protected readonly pickup = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
}
