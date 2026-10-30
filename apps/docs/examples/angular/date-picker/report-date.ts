import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker, SlDatePickerPresets } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { createDateFormat, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const PRESETS = [
  { label: 'Today', date: TODAY },
  { label: 'End of last month', date: plainDate(2026, 8, 31) },
  { label: 'End of last quarter', date: plainDate(2026, 6, 30) },
  { label: 'End of fiscal 2025', date: plainDate(2025, 12, 31) },
];
const words = createDateFormat({ locale: 'en-US' });

@Component({
  selector: 'app-date-picker-report-date',
  imports: [SlButton, SlDatePicker, SlDatePickerPresets, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Balance sheet as of</label>
      <div
        slDatePicker
        #picker="slDatePicker"
        [max]="today"
        [value]="asOf()"
        (valueChange)="set($event.value)"
      >
        <div slDatePickerPresets>
          @for (preset of presets; track preset.label) {
            <button
              slButton
              size="sm"
              variant="ghost"
              type="button"
              (click)="asOf.set(preset.date); picker.closeSurface()"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      </div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DatePickerReportDate {
  protected readonly today = TODAY;
  protected readonly presets = PRESETS;
  protected readonly asOf = signal<PlainDate | null>(plainDate(2026, 8, 31));
  protected readonly summary = computed(() => {
    const asOf = this.asOf();
    return asOf === null
      ? 'Choose the closing date of the report.'
      : `Balances close at the end of ${words.describe(asOf)}.`;
  });

  protected set(value: CalendarValue): void {
    this.asOf.set(isPlainDate(value) ? value : null);
  }
}
