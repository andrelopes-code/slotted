import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateTimePicker, SlDateTimePickerPresets } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  addDays,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

@Component({
  selector: 'app-datetime-picker-narrow',
  imports: [SlButton, SlDateTimePicker, SlDateTimePickerPresets, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Delivery appointment</label>
      <div
        slDateTimePicker
        #picker="slDateTimePicker"
        [referenceDateTime]="reference"
        [step]="1800"
        [value]="delivery()"
        (valueChange)="delivery.set($event.value)"
      >
        <div slDateTimePickerPresets>
          <button
            slButton
            size="sm"
            type="button"
            variant="ghost"
            (click)="delivery.set(todayAtFive); picker.closeSurface()"
          >
            Today, 5:00 PM
          </button>
          <button
            slButton
            size="sm"
            type="button"
            variant="ghost"
            (click)="delivery.set(tomorrowAtNine); picker.closeSurface()"
          >
            Tomorrow, 9:00 AM
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DateTimePickerNarrow {
  protected readonly reference = plainDateTime(TODAY, plainTime(9, 0));
  protected readonly todayAtFive = plainDateTime(TODAY, plainTime(17, 0));
  protected readonly tomorrowAtNine = plainDateTime(addDays(TODAY, 1), plainTime(9, 0));
  protected readonly delivery = signal<PlainDateTime | null>(null);
}
