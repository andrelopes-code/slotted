import { Component, computed, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  addDays,
  compareDate,
  createDateFormat,
  dayOfWeek,
  isPlainDate,
  plainDate,
  toISODate,
  type PlainDate,
} from '@slotted/core/date';

const ORDERED = plainDate(2026, 9, 30);
const HOLIDAYS = new Set(['2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);
const words = createDateFormat({ locale: 'en-US' });

const isBusinessDay = (date: PlainDate) =>
  dayOfWeek(date) !== 0 && dayOfWeek(date) !== 6 && !HOLIDAYS.has(toISODate(date));

const addBusinessDays = (from: PlainDate, count: number) => {
  let date = from;
  for (let added = 0; added < count;) {
    date = addDays(date, 1);
    if (isBusinessDay(date)) added += 1;
  }
  return date;
};

const businessDaysBetween = (from: PlainDate, to: PlainDate) => {
  let count = 0;
  for (let date = addDays(from, 1); compareDate(date, to) <= 0; date = addDays(date, 1)) {
    if (isBusinessDay(date)) count += 1;
  }
  return count;
};

const EARLIEST = addBusinessDays(ORDERED, 2);
const LATEST = addBusinessDays(ORDERED, 40);

@Component({
  selector: 'app-date-picker-shipping-date',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField required>
      <label slFieldLabel>Ship date</label>
      <div
        slDatePicker
        [isDateUnavailable]="isClosed"
        [max]="latest"
        [min]="earliest"
        [value]="date()"
        (valueChange)="set($event.value)"
      ></div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DatePickerShippingDate {
  protected readonly earliest = EARLIEST;
  protected readonly latest = LATEST;
  protected readonly isClosed = (day: PlainDate) => !isBusinessDay(day);
  protected readonly date = signal<PlainDate | null>(EARLIEST);
  protected readonly summary = computed(() => {
    const date = this.date();
    return date === null
      ? 'Orders ship 2 to 40 business days after they are placed.'
      : `Ships ${words.describe(date)}, ${businessDaysBetween(ORDERED, date)} business days after the order.`;
  });

  protected set(value: CalendarValue): void {
    this.date.set(isPlainDate(value) ? value : null);
  }
}
