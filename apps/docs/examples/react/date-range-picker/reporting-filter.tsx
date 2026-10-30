import { useState } from 'react';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker, DateRangePickerPreset } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import {
  StatCard,
  StatCardComparison,
  StatCardDelta,
  StatCardFigure,
  StatCardHeader,
  StatCardLabel,
  StatCardPeriod,
  StatCardValue,
} from '@slotted/react/stat-card';
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

export default function DateRangePickerReportingFilter() {
  const [period, setPeriod] = useState<DateRange | null>(LAST_7_DAYS);

  const whole = period?.start && period.end ? { start: period.start, end: period.end } : null;
  const days = whole ? daysBetween(whole.start, whole.end) + 1 : 0;
  const orders = whole ? ordersBetween(whole.start, whole.end) : 0;
  const previous = whole ? ordersBetween(addDays(whole.start, -days), addDays(whole.start, -1)) : 0;
  const delta = previous === 0 ? 0 : (orders - previous) / previous;

  return (
    <Stack gap={5}>
      <Field size="sm">
        <FieldLabel>Period</FieldLabel>
        <DateRangePicker
          max={TODAY}
          onValueChange={(value) => setPeriod(value)}
          presets={PRESETS.map((preset) => (
            <DateRangePickerPreset key={preset.label} value={preset.range}>
              {preset.label}
            </DateRangePickerPreset>
          ))}
          value={period}
        />
      </Field>
      <Grid gap={4} minItemWidth="sm">
        <StatCard delta={delta} goodWhen="up">
          <StatCardHeader>
            <StatCardLabel>Orders shipped</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue value={orders} />
            <StatCardDelta />
            <StatCardComparison>
              from {previous.toLocaleString('en-US')}{' '}
              <StatCardPeriod>previous {days} days</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
        </StatCard>
        <StatCard>
          <StatCardHeader>
            <StatCardLabel>Orders per day</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue value={days === 0 ? 0 : Math.round(orders / days)} />
            <StatCardComparison>
              over <StatCardPeriod>{days} days</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
        </StatCard>
      </Grid>
    </Stack>
  );
}
