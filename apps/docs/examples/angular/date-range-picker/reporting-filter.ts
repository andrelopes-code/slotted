import { Component, computed, signal } from '@angular/core';
import {
  SlDateRangePicker,
  SlDateRangePickerPreset,
  SlDateRangePickerPresets,
  type DateRange,
} from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardDelta,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardPeriod,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import { addDays, daysBetween, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const LAST_7_DAYS: DateRange = { start: addDays(TODAY, -6), end: TODAY };
const PRESETS: { label: string; range: DateRange }[] = [
  { label: 'Last 7 days', range: LAST_7_DAYS },
  { label: 'Last 30 days', range: { start: addDays(TODAY, -29), end: TODAY } },
  { label: 'This quarter', range: { start: plainDate(2026, 7, 1), end: TODAY } },
];

/** Orders shipped on one day, from the Northwind warehouse feed. */
const ordersOn = (date: PlainDate) => 150 + date.month * 6 + ((date.day * 37) % 50);

const ordersBetween = (start: PlainDate, end: PlainDate) => {
  let total = 0;
  for (let date = start; daysBetween(date, end) >= 0; date = addDays(date, 1)) {
    total += ordersOn(date);
  }
  return total;
};

@Component({
  selector: 'app-date-range-picker-reporting-filter',
  imports: [
    SlDateRangePicker,
    SlDateRangePickerPreset,
    SlDateRangePickerPresets,
    SlField,
    SlFieldLabel,
    SlGrid,
    SlStack,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardDelta,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardPeriod,
    SlStatCardValue,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField size="sm">
        <label slFieldLabel>Period</label>
        <div
          slDateRangePicker
          [max]="today"
          [value]="period()"
          (valueChange)="period.set($event.value)"
        >
          <div slDateRangePickerPresets>
            @for (preset of presets; track preset.label) {
              <button [slDateRangePickerPreset]="preset.range">{{ preset.label }}</button>
            }
          </div>
        </div>
      </div>
      <div slGrid [gap]="4" minItemWidth="sm">
        <div slStatCard goodWhen="up" [delta]="figures().delta">
          <div slStatCardHeader><span slStatCardLabel>Orders shipped</span></div>
          <div slStatCardFigure>
            <span slStatCardValue [value]="figures().orders"></span>
            <span slStatCardDelta></span>
            <p slStatCardComparison>
              from {{ figures().previous.toLocaleString('en-US') }}
              <span slStatCardPeriod>previous {{ figures().days }} days</span>
            </p>
          </div>
        </div>
        <div slStatCard>
          <div slStatCardHeader><span slStatCardLabel>Orders per day</span></div>
          <div slStatCardFigure>
            <span slStatCardValue [value]="figures().perDay"></span>
            <p slStatCardComparison>
              over <span slStatCardPeriod>{{ figures().days }} days</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DateRangePickerReportingFilter {
  protected readonly today = TODAY;
  protected readonly presets = PRESETS;
  protected readonly period = signal<DateRange | null>(LAST_7_DAYS);
  protected readonly figures = computed(() => {
    const period = this.period();
    if (!period?.start || !period.end)
      return { days: 0, orders: 0, previous: 0, delta: 0, perDay: 0 };
    const days = daysBetween(period.start, period.end) + 1;
    const orders = ordersBetween(period.start, period.end);
    const previous = ordersBetween(addDays(period.start, -days), addDays(period.start, -1));
    return {
      days,
      orders,
      previous,
      delta: previous === 0 ? 0 : (orders - previous) / previous,
      perDay: Math.round(orders / days),
    };
  });
}
