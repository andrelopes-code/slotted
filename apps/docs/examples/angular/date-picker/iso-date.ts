import { Component, computed, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { isPlainDate, parseISODate, toISODate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-iso-date',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Statement date</label>
      <div slDatePicker [value]="date()" (valueChange)="set($event.value)"></div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DatePickerIsoDate {
  /* The API carries the date as text; the picker holds a PlainDate. */
  protected readonly iso = signal('2026-10-19');
  protected readonly date = computed(() => parseISODate(this.iso()));
  protected readonly summary = computed(() =>
    this.iso() === '' ? 'No date sent.' : `The API receives ${this.iso()}.`,
  );

  protected set(value: CalendarValue): void {
    this.iso.set(isPlainDate(value) ? toISODate(value) : '');
  }
}
