import { Component, signal } from '@angular/core';
import { SlDateRangePicker, type DateRange } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { toISODate, type PlainDate } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

const HOW: Record<string, string> = {
  blur: 'completed when the field lost focus',
  clear: 'cleared',
  keyboard: 'typed',
  pointer: 'pressed',
  programmatic: 'set from code',
  select: 'chosen in the calendar',
};
const iso = (date: PlainDate | null) => (date === null ? 'open' : toISODate(date));

@Component({
  selector: 'app-date-range-picker-typing',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Audit window</label>
      <div slDateRangePicker [value]="period()" (valueChange)="record($event)"></div>
      <span slFieldDescription>{{ last() }}</span>
    </div>
  `,
})
export class DateRangePickerTyping {
  protected readonly period = signal<DateRange | null>(null);
  protected readonly last = signal('Type both dates, or choose two days in the calendar.');

  protected record(request: ChangeRequest<DateRange | null>): void {
    const value = request.value;
    this.period.set(value);
    this.last.set(
      value === null
        ? `No dates, ${HOW[request.reason]}.`
        : `${iso(value.start)} to ${iso(value.end)}, ${HOW[request.reason]}.`,
    );
  }
}
