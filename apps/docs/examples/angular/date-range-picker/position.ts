import { Component, computed, signal } from '@angular/core';
import { SlDateRangePicker, type DateRange } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, toISODate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-position',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Scissor lift rental</label>
      <div
        slDateRangePicker
        defaultPosition="end"
        [value]="rental()"
        (valueChange)="rental.set($event.value)"
      ></div>
      <span slFieldDescription>{{ summary() }}</span>
    </div>
  `,
})
export class DateRangePickerPosition {
  protected readonly rental = signal<DateRange | null>({
    start: plainDate(2026, 10, 5),
    end: plainDate(2026, 10, 9),
  });
  protected readonly summary = computed(() => {
    const end = this.rental()?.end;
    return end
      ? `Returns ${toISODate(end)}. Open the calendar and press a day to move the return date.`
      : 'Choose a return date.';
  });
}
