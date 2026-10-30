import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker, SlDatePickerPresets } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

const PRESETS = [
  { label: 'Today', date: TODAY },
  { label: 'Tomorrow', date: addDays(TODAY, 1) },
  { label: 'Next Monday', date: plainDate(2026, 10, 5) },
  { label: 'In 2 weeks', date: addDays(TODAY, 14) },
];

@Component({
  selector: 'app-date-picker-presets',
  imports: [SlButton, SlDatePicker, SlDatePickerPresets, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Dispatch date</label>
      <div slDatePicker #picker="slDatePicker" [value]="date()" (valueChange)="set($event.value)">
        <div slDatePickerPresets>
          @for (preset of presets; track preset.label) {
            <button
              slButton
              size="sm"
              variant="ghost"
              type="button"
              (click)="date.set(preset.date); picker.closeSurface()"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      </div>
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
