import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-placement',
  imports: [SlDatePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Opens above, from the start edge</label>
        <div slDatePicker placement="top-start" [defaultValue]="today"></div>
      </div>
      <div slField>
        <label slFieldLabel>Opens below, from the end edge</label>
        <div slDatePicker placement="bottom-end" [defaultValue]="today"></div>
      </div>
    </div>
  `,
})
export class DatePickerPlacement {
  protected readonly today = plainDate(2026, 9, 30);
}
