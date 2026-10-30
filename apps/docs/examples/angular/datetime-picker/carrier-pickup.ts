import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDateTimePicker,
  SlDateTimePickerFooter,
  SlDateTimePickerOption,
} from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlText } from '@slotted/angular/typography';
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
  imports: [
    SlButton,
    SlDateTimePicker,
    SlDateTimePickerFooter,
    SlDateTimePickerOption,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlText,
  ],
  template: `
    <div slField required>
      <label slFieldLabel>Carrier pickup slot</label>
      <div
        slDateTimePicker
        #picker="slDateTimePicker"
        closeOnSelect="never"
        [isDateUnavailable]="isWeekend"
        [isTimeUnavailable]="isFull"
        [min]="earliest"
        [options]="windows"
        [referenceDateTime]="reference"
        [value]="pickup()"
        (valueChange)="pickup.set($event.value)"
      >
        <ng-template
          slDateTimePickerOption
          let-time
          let-date="date"
          let-label="label"
          let-unavailable="unavailable"
        >
          <span>{{ label }}</span>
          <span slText size="sm" tone="muted">{{ capacity(time, date, unavailable) }}</span>
        </ng-template>
        <div slDateTimePickerFooter>
          <button slButton size="sm" type="button" (click)="picker.closeSurface()">Done</button>
        </div>
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
      ? 'Harbor Freightways collects on weekdays, in four windows.'
      : `Harbor Freightways collects on ${words.describe(pickup)}.`;
  });

  protected readonly isWeekend = (date: PlainDate) =>
    dayOfWeek(date) === 0 || dayOfWeek(date) === 6;
  protected readonly isFull = (time: PlainTime, date: PlainDate) => trucksLeft(time, date) === 0;

  protected capacity(time: PlainTime, date: PlainDate, unavailable: boolean): string {
    return unavailable ? 'Full' : `${trucksLeft(time, date)} of ${TRUCKS_PER_WINDOW} trucks left`;
  }
}
