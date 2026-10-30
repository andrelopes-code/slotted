import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker, SlDatePickerPresets } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { addDays, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

@Component({
  selector: 'app-date-picker-narrow',
  imports: [SlButton, SlDatePicker, SlDatePickerPresets, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Proof of delivery date</label>
      <div slDatePicker #picker="slDatePicker" [value]="date()" (valueChange)="set($event.value)">
        <div slDatePickerPresets>
          <button
            slButton
            size="sm"
            variant="ghost"
            type="button"
            (click)="date.set(today); picker.closeSurface()"
          >
            Today
          </button>
          <button
            slButton
            size="sm"
            variant="ghost"
            type="button"
            (click)="date.set(yesterday); picker.closeSurface()"
          >
            Yesterday
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DatePickerNarrow {
  protected readonly today = TODAY;
  protected readonly yesterday = addDays(TODAY, -1);
  protected readonly date = signal<PlainDate | null>(null);

  protected set(value: CalendarValue): void {
    this.date.set(isPlainDate(value) ? value : null);
  }
}
