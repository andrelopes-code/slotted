import { Component, signal } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  plainDate,
  plainDateTime,
  plainTime,
  toISODateTime,
  type PlainDateTime,
} from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

const REASONS: Record<string, string> = {
  keyboard: 'from the keyboard',
  select: 'chosen in the panel',
  clear: 'cleared',
  blur: 'completed when the field lost focus',
};

@Component({
  selector: 'app-datetime-picker-typing',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Goods received at</label>
      <div
        slDateTimePicker
        [defaultValue]="received"
        [referenceDateTime]="received"
        (valueChange)="record($event)"
      ></div>
      <span slFieldDescription>{{ change() }}</span>
    </div>
  `,
})
export class DateTimePickerTyping {
  protected readonly received = plainDateTime(plainDate(2026, 9, 30), plainTime(14, 30));
  protected readonly change = signal('No change yet.');

  protected record(request: ChangeRequest<PlainDateTime | null>): void {
    const text = request.value === null ? 'empty' : toISODateTime(request.value);
    this.change.set(`${text}, ${REASONS[request.reason] ?? request.reason}.`);
  }
}
