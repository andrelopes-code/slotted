import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import {
  addDays,
  createDateTimeFormat,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const words = createDateTimeFormat({ locale: 'en-US' });

@Component({
  selector: 'app-datetime-picker-controlled',
  imports: [
    SlButton,
    SlDateTimePicker,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlInline,
    SlStack,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Call Harbor Freightways</label>
        <div slDateTimePicker [value]="call()" (valueChange)="call.set($event.value)"></div>
        <span slFieldDescription>{{ summary() }}</span>
      </div>
      <div slInline [gap]="2">
        <button
          slButton
          size="sm"
          tone="secondary"
          type="button"
          variant="outline"
          (click)="schedule(1, 9)"
        >
          Tomorrow, 9:00 AM
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          type="button"
          variant="outline"
          (click)="schedule(2, 14)"
        >
          Friday, 2:00 PM
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          type="button"
          variant="ghost"
          (click)="call.set(null)"
        >
          No call
        </button>
      </div>
    </div>
  `,
})
export class DateTimePickerControlled {
  protected readonly call = signal<PlainDateTime | null>(
    plainDateTime(addDays(TODAY, 1), plainTime(9, 0)),
  );
  protected readonly summary = computed(() => {
    const call = this.call();
    return call === null ? 'No call scheduled.' : `Call on ${words.describe(call)}.`;
  });

  protected schedule(days: number, hour: number): void {
    this.call.set(plainDateTime(addDays(TODAY, days), plainTime(hour, 0)));
  }
}
