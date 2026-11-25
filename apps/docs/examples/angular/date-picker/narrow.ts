import { Component } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-narrow',
  imports: [SlDatePicker, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Proof of delivery date</label>
      <div slDatePicker [presets]="presets"></div>
    </div>
  `,
})
export class DatePickerNarrow {
  protected readonly presets = [
    { label: 'Pickup', value: plainDate(2026, 9, 28) },
    { label: 'Promised', value: plainDate(2026, 9, 30) },
  ];
}
