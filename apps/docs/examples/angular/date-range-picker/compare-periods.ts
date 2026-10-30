import { Component, computed, signal } from '@angular/core';
import {
  SlDateRangePicker,
  SlDateRangePickerPreset,
  SlDateRangePickerPresets,
  type DateRange,
} from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { addDays, daysBetween, plainDate, stepYear } from '@slotted/core/date';

const SEPTEMBER: DateRange = { start: plainDate(2026, 9, 1), end: plainDate(2026, 9, 30) };

/** The run of the same length that ends the day before the period starts. */
const previousPeriod = (period: DateRange): DateRange | null => {
  if (period.start === null || period.end === null) return null;
  const days = daysBetween(period.start, period.end) + 1;
  return { start: addDays(period.start, -days), end: addDays(period.start, -1) };
};

const lastYear = (period: DateRange): DateRange | null =>
  period.start === null || period.end === null
    ? null
    : { start: stepYear(period.start, -1).date, end: stepYear(period.end, -1).date };

@Component({
  selector: 'app-date-range-picker-compare-periods',
  imports: [
    SlDateRangePicker,
    SlDateRangePickerPreset,
    SlDateRangePickerPresets,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Period</label>
        <div slDateRangePicker [value]="period()" (valueChange)="period.set($event.value)"></div>
      </div>
      <div slField>
        <label slFieldLabel>Compare to</label>
        <div slDateRangePicker [value]="baseline()" (valueChange)="baseline.set($event.value)">
          <div slDateRangePickerPresets>
            @if (previous(); as range) {
              <button [slDateRangePickerPreset]="range">Previous period</button>
            }
            @if (sameLastYear(); as range) {
              <button [slDateRangePickerPreset]="range">Same period last year</button>
            }
          </div>
        </div>
        <span slFieldDescription>Shortcuts follow the period above.</span>
      </div>
    </div>
  `,
})
export class DateRangePickerComparePeriods {
  protected readonly period = signal<DateRange | null>(SEPTEMBER);
  protected readonly baseline = signal<DateRange | null>(previousPeriod(SEPTEMBER));
  protected readonly previous = computed(() => {
    const period = this.period();
    return period === null ? null : previousPeriod(period);
  });
  protected readonly sameLastYear = computed(() => {
    const period = this.period();
    return period === null ? null : lastYear(period);
  });
}
