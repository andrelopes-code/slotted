import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-variants',
  imports: [SlDatePicker, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Invoice date</label>
        <div slDatePicker variant="outline" [defaultValue]="invoiced"></div>
      </div>
      <div slField>
        <label slFieldLabel>Posting date</label>
        <div slDatePicker variant="subtle" [defaultValue]="invoiced"></div>
      </div>
      <div slField>
        <label slFieldLabel>Value date</label>
        <div slDatePicker variant="plain" [defaultValue]="valueDate"></div>
      </div>
    </div>
  `,
})
export class DatePickerVariants {
  protected readonly invoiced = plainDate(2026, 9, 30);
  protected readonly valueDate = plainDate(2026, 10, 1);
}
