import { Component } from '@angular/core';
import { provideDatePickerDefaults, SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-defaults',
  imports: [SlDatePicker, SlField, SlFieldLabel, SlStack],
  providers: [
    provideDatePickerDefaults({ size: 'sm', variant: 'subtle', placement: 'bottom-end' }),
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Posted after</label>
        <div slDatePicker [defaultValue]="postedAfter"></div>
      </div>
      <div slField>
        <label slFieldLabel>Due before</label>
        <div slDatePicker [defaultValue]="dueBefore"></div>
      </div>
    </div>
  `,
})
export class DatePickerDefaults {
  protected readonly postedAfter = plainDate(2026, 9, 1);
  protected readonly dueBefore = plainDate(2026, 10, 31);
}
