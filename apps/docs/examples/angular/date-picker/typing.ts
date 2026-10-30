import { Component, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { isPlainDate, plainDate, toISODate } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

const REASONS: Record<string, string> = {
  keyboard: 'from the keyboard',
  pointer: 'pressed in the calendar',
  clear: 'cleared',
  blur: 'completed when the field lost focus',
};

@Component({
  selector: 'app-date-picker-typing',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Goods received on</label>
      <div slDatePicker [defaultValue]="received" (valueChange)="record($event)"></div>
      <span slFieldDescription>{{ change() }}</span>
    </div>
  `,
})
export class DatePickerTyping {
  protected readonly received = plainDate(2026, 9, 30);
  protected readonly change = signal('No change yet.');

  protected record(request: ChangeRequest<CalendarValue>): void {
    const date = isPlainDate(request.value) ? toISODate(request.value) : 'empty';
    this.change.set(`${date}, ${REASONS[request.reason] ?? request.reason}.`);
  }
}
