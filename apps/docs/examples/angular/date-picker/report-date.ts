import { Component, computed, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { createDateFormat, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const PRESETS = [
  { label: 'End of last month', value: plainDate(2026, 8, 31) },
  { label: 'End of last quarter', value: plainDate(2026, 6, 30) },
  { label: 'End of fiscal 2025', value: plainDate(2025, 12, 31) },
];
const words = createDateFormat({ locale: 'en-US' });

@Component({
  selector: 'app-date-picker-report-date',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Balance sheet as of</label>
      <div
        slDatePicker
        [max]="today"
        [presets]="presets"
        [value]="asOf()"
        (valueChange)="set($event.value)"
      ></div>
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
