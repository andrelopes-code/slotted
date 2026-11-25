import { Component, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

const PRESETS = [
  { label: 'End of the quarter', value: TODAY },
  { label: 'Next Monday', value: plainDate(2026, 10, 5) },
  { label: 'In two weeks', value: () => addDays(TODAY, 14) },
];

@Component({
  selector: 'app-date-picker-presets',
  imports: [SlDatePicker, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Dispatch date</label>
      <div
        slDatePicker
        [presets]="presets"
        [value]="date()"
        (valueChange)="set($event.value)"
      ></div>
    </div>
  `,
})
export class DatePickerPresets {
  protected readonly presets = PRESETS;
  protected readonly date = signal<PlainDate | null>(TODAY);

  protected set(value: CalendarValue): void {
    this.date.set(isPlainDate(value) ? value : null);
  }
}
