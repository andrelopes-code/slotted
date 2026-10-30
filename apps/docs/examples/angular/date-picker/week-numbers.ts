import { Component, computed, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { isPlainDate, isoWeekNumber, plainDate, type PlainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-week-numbers',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Production run</label>
      <div
        slDatePicker
        weekNumbers
        [firstDayOfWeek]="1"
        [value]="date()"
        (valueChange)="set($event.value)"
      ></div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DatePickerWeekNumbers {
  protected readonly date = signal<PlainDate | null>(plainDate(2026, 9, 30));

  protected set(value: CalendarValue): void {
    this.date.set(isPlainDate(value) ? value : null);
  }

  protected readonly summary = computed(() => {
    const date = this.date();
    return date === null ? 'No week planned.' : `Planned for week ${isoWeekNumber(date)}.`;
  });
}
