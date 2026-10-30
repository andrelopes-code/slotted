import { Component, computed, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { isPlainDate, plainDate, toISODate, type PlainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-time-zones',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Settlement date, Auckland desk</label>
        <div
          slDatePicker
          timeZone="Pacific/Auckland"
          [value]="date()"
          (valueChange)="set($event.value)"
        ></div>
        <span slFieldDescription>Today is marked by the date in Auckland.</span>
      </div>
      <span slText size="sm" tone="muted">{{ readout() }}</span>
    </div>
  `,
})
export class DatePickerTimeZones {
  protected readonly date = signal<PlainDate | null>(plainDate(2026, 9, 30));
  protected readonly readout = computed(() => {
    const date = this.date();
    return date === null
      ? 'Value: null'
      : `Value: ${JSON.stringify(date)}, sent as ${toISODate(date)}`;
  });

  protected set(value: CalendarValue): void {
    this.date.set(isPlainDate(value) ? value : null);
  }
}
