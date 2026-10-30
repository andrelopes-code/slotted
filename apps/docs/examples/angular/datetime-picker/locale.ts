import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-locale',
  imports: [SlDateTimePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Pickup, United States (en-US)</label>
        <div slDateTimePicker locale="en-US" [defaultValue]="pickup"></div>
      </div>
      <div slField>
        <label slFieldLabel>Pickup, United Kingdom (en-GB)</label>
        <div slDateTimePicker locale="en-GB" [defaultValue]="pickup"></div>
      </div>
      <div slField>
        <label slFieldLabel>Pickup, Germany (de-DE)</label>
        <div slDateTimePicker locale="de-DE" [defaultValue]="pickup"></div>
      </div>
      <div slField>
        <label slFieldLabel>Pickup, Japan (ja-JP)</label>
        <div slDateTimePicker locale="ja-JP" [defaultValue]="pickup"></div>
      </div>
    </div>
  `,
})
export class DateTimePickerLocale {
  protected readonly pickup = plainDateTime(plainDate(2026, 9, 30), plainTime(14, 30));
}
