import { Component, computed, signal } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { toISODateTime, wallClockIn, type PlainDateTime } from '@slotted/core/date';

/** The pickup as the server stores it: an instant, 7:00 PM UTC on September 30, 2026. */
const STORED = Date.UTC(2026, 8, 30, 19, 0);

@Component({
  selector: 'app-datetime-picker-time-zones',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Pickup, Chicago terminal</label>
        <div
          slDateTimePicker
          timeZone="America/Chicago"
          [value]="pickup()"
          (valueChange)="pickup.set($event.value)"
        ></div>
        <span slFieldDescription>Today and Now follow the clock in Chicago.</span>
      </div>
      <span slText size="sm" tone="muted">{{ readout() }}</span>
    </div>
  `,
})
export class DateTimePickerTimeZones {
  protected readonly pickup = signal<PlainDateTime | null>(wallClockIn(STORED, 'America/Chicago'));
  protected readonly readout = computed(() => {
    const pickup = this.pickup();
    return pickup === null ? 'Value: null' : `Value: ${toISODateTime(pickup)}, with no offset`;
  });
}
