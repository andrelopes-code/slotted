import { Component } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

@Component({
  selector: 'app-datetime-picker-narrow',
  imports: [SlDateTimePicker, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Delivery appointment</label>
      <div slDateTimePicker [presets]="presets" [referenceDateTime]="reference" [step]="1800"></div>
    </div>
  `,
})
export class DateTimePickerNarrow {
  protected readonly reference = plainDateTime(TODAY, plainTime(9, 0));
  protected readonly presets = [
    { label: 'End of today', value: plainDateTime(TODAY, plainTime(17, 0)) },
    { label: 'Tomorrow early', value: plainDateTime(addDays(TODAY, 1), plainTime(9, 0)) },
  ];
}
