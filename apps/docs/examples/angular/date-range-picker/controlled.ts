import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateRangePicker, type DateRange } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { endOfMonth, plainDate, startOfMonth, stepMonth, toISODate } from '@slotted/core/date';

const SEPTEMBER: DateRange = { start: plainDate(2026, 9, 1), end: plainDate(2026, 9, 30) };
const FALLBACK = plainDate(2026, 9, 1);

/** The calendar month before or after the one the range starts in. */
const shift = (range: DateRange | null, months: number): DateRange => {
  const first = startOfMonth(stepMonth(range?.start ?? FALLBACK, months).date);
  return { start: first, end: endOfMonth(first) };
};

@Component({
  selector: 'app-date-range-picker-controlled',
  imports: [
    SlButton,
    SlDateRangePicker,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlInline,
    SlStack,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Statement period</label>
        <div slDateRangePicker [value]="period()" (valueChange)="period.set($event.value)"></div>
        <span slFieldDescription>{{ summary() }}</span>
      </div>
      <div slInline [gap]="2">
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="move(-1)"
        >
          Previous month
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="move(1)"
        >
          Next month
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="ghost"
          type="button"
          (click)="period.set(null)"
        >
          Clear
        </button>
      </div>
    </div>
  `,
})
export class DateRangePickerControlled {
  protected readonly period = signal<DateRange | null>(SEPTEMBER);
  protected readonly summary = computed(() => {
    const period = this.period();
    return period?.start && period.end
      ? `Statement from ${toISODate(period.start)} to ${toISODate(period.end)}.`
      : 'Choose both dates to run the statement.';
  });

  protected move(months: number): void {
    this.period.set(shift(this.period(), months));
  }
}
