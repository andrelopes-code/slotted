import { Component, computed, signal } from '@angular/core';
import { SlDateRangePicker, type DateRange } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  createDateFormat,
  dayOfWeek,
  plainDate,
  toISODate,
  type PlainDate,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
/** Days another carrier already holds dock 4. */
const HELD = new Set(['2026-10-07', '2026-10-08', '2026-10-21', '2026-10-22', '2026-10-23']);
const words = createDateFormat({ locale: 'en-US' });

const isClosed = (date: PlainDate) =>
  dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || HELD.has(toISODate(date));

@Component({
  selector: 'app-date-range-picker-dock-booking',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField required>
      <label slFieldLabel>Dock 4 unloading window</label>
      <div
        slDateRangePicker
        [isDateUnavailable]="isClosed"
        [max]="latest"
        [maxLength]="3"
        [min]="earliest"
        [value]="slot()"
        (valueChange)="slot.set($event.value)"
      ></div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DateRangePickerDockBooking {
  protected readonly isClosed = isClosed;
  protected readonly earliest = plainDate(2026, 10, 1);
  protected readonly latest = plainDate(2026, 11, 30);
  protected readonly slot = signal<DateRange | null>(null);
  protected readonly summary = computed(() => {
    const slot = this.slot();
    return slot?.start && slot.end
      ? `Dock 4 is yours from ${words.describe(slot.start)} to ${words.describe(slot.end)}.`
      : `Book 1 to 3 weekdays from October 1. Booked as of ${words.describe(TODAY)}: Oct 7–8 and Oct 21–23.`;
  });
}
