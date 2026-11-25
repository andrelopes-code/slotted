import { Component, computed, signal } from '@angular/core';
import { SlClockSlot } from '@slotted/angular/clock';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  createDateTimeFormat,
  dayOfWeek,
  plainDate,
  plainDateTime,
  plainTime,
  toISODate,
  toISOTime,
  type PlainDate,
  type PlainDateTime,
  type PlainTime,
} from '@slotted/core/date';

const TRUCKS_PER_WINDOW = 3;
/** Pickups already booked, by date and window. */
const BOOKED: Record<string, number> = {
  '2026-10-01T08:00:00': 3,
  '2026-10-01T10:30:00': 2,
  '2026-10-02T13:00:00': 3,
  '2026-10-02T15:30:00': 1,
};
const words = createDateTimeFormat({ locale: 'en-US' });

const trucksLeft = (time: PlainTime, date: PlainDate) =>
  TRUCKS_PER_WINDOW - (BOOKED[`${toISODate(date)}T${toISOTime(time)}`] ?? 0);

@Component({
  selector: 'app-datetime-picker-carrier-pickup',
  imports: [SlClockSlot, SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField required>
      <label slFieldLabel>Carrier pickup slot</label>
      <div
        slDateTimePicker
        [hourCycle]="24"
        [isDateUnavailable]="isWeekend"
        [isTimeUnavailable]="isFull"
        [min]="earliest"
        [options]="windows"
        [referenceDateTime]="reference"
        [value]="pickup()"
        (valueChange)="pickup.set($event.value)"
      >
        <ng-template slClockSlot let-time let-date="date" let-state="state">
          {{ slot(time, date, state.label) }}
        </ng-template>
      </div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DateTimePickerCarrierPickup {
  /** The windows Harbor Freightways collects in, every weekday. */
  protected readonly windows = [
    plainTime(8, 0),
    plainTime(10, 30),
    plainTime(13, 0),
    plainTime(15, 30),
  ];
  protected readonly earliest = plainDateTime(plainDate(2026, 10, 1), plainTime(8, 0));
  protected readonly reference = plainDateTime(plainDate(2026, 10, 1), plainTime(10, 30));
  protected readonly pickup = signal<PlainDateTime | null>(null);
  protected readonly summary = computed(() => {
    const pickup = this.pickup();
    return pickup === null
      ? 'Harbor Freightways collects on weekdays. Each window says the trucks left.'
      : `Harbor Freightways collects on ${words.describe(pickup)}.`;
  });

  protected readonly isWeekend = (date: PlainDate) =>
    dayOfWeek(date) === 0 || dayOfWeek(date) === 6;
  protected readonly isFull = (time: PlainTime, date: PlainDate) => trucksLeft(time, date) === 0;

  protected slot(time: PlainTime, date: PlainDate | null, label: string): string {
    const left = date === null ? 0 : trucksLeft(time, date);

    return left === 0 ? label : `${label} (${String(left)})`;
  }
}
