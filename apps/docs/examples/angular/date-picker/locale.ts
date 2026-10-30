import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-locale',
  imports: [SlDatePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Ship date, United States (en-US)</label>
        <div slDatePicker locale="en-US" [defaultValue]="shipDate"></div>
      </div>
      <div slField>
        <label slFieldLabel>Ship date, United Kingdom (en-GB)</label>
        <div slDatePicker locale="en-GB" [defaultValue]="shipDate"></div>
      </div>
      <div slField>
        <label slFieldLabel>Ship date, Germany (de-DE)</label>
        <div slDatePicker locale="de-DE" [defaultValue]="shipDate"></div>
      </div>
      <div slField>
        <label slFieldLabel>Ship date, Japan (ja-JP)</label>
        <div slDatePicker locale="ja-JP" [defaultValue]="shipDate"></div>
      </div>
    </div>
  `,
})
export class DatePickerLocale {
  protected readonly shipDate = plainDate(2026, 9, 30);
}
