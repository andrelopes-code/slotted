import { Component, computed, signal } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  createDateTimeFormat,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const words = createDateTimeFormat({ locale: 'en-US' });

@Component({
  selector: 'app-datetime-picker-reference',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Courier collection</label>
      <div
        slDateTimePicker
        [referenceDateTime]="endOfShift"
        [value]="collection()"
        (valueChange)="collection.set($event.value)"
      ></div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DateTimePickerReference {
  protected readonly endOfShift = plainDateTime(plainDate(2026, 10, 1), plainTime(15, 0));
  protected readonly collection = signal<PlainDateTime | null>(null);
  protected readonly summary = computed(() => {
    const collection = this.collection();
    return collection === null
      ? 'A day chosen in the calendar opens the time list on 3:00 PM.'
      : `Collection on ${words.describe(collection)}.`;
  });
}
