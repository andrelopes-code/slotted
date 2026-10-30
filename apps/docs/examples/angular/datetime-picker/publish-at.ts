import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateTimePicker, SlDateTimePickerPresets } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  addDays,
  createDateTimeFormat,
  dayOfWeek,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const NOW = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
const TOMORROW = plainDateTime(addDays(NOW.date, 1), plainTime(9, 0));
const NEXT_MONDAY = plainDateTime(
  addDays(NOW.date, (8 - dayOfWeek(NOW.date)) % 7 || 7),
  plainTime(9, 0),
);
const words = createDateTimeFormat({ locale: 'en-US' });

@Component({
  selector: 'app-datetime-picker-publish-at',
  imports: [
    SlButton,
    SlDateTimePicker,
    SlDateTimePickerPresets,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
  ],
  template: `
    <div slField required>
      <label slFieldLabel>Publish the autumn price list at</label>
      <div
        slDateTimePicker
        #picker="slDateTimePicker"
        timeZone="America/New_York"
        [min]="now"
        [referenceDateTime]="now"
        [value]="publishAt()"
        (valueChange)="publishAt.set($event.value)"
      >
        <div slDateTimePickerPresets>
          <button
            slButton
            size="sm"
            type="button"
            variant="ghost"
            (click)="publishAt.set(tomorrow); picker.closeSurface()"
          >
            Tomorrow, 9:00 AM
          </button>
          <button
            slButton
            size="sm"
            type="button"
            variant="ghost"
            (click)="publishAt.set(nextMonday); picker.closeSurface()"
          >
            Monday, 9:00 AM
          </button>
        </div>
      </div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DateTimePickerPublishAt {
  protected readonly now = NOW;
  protected readonly tomorrow = TOMORROW;
  protected readonly nextMonday = NEXT_MONDAY;
  protected readonly publishAt = signal<PlainDateTime | null>(TOMORROW);
  protected readonly summary = computed(() => {
    const publishAt = this.publishAt();
    return publishAt === null
      ? 'Choose when the new prices go live, New York time.'
      : `Prices go live on ${words.describe(publishAt)}, New York time.`;
  });
}
