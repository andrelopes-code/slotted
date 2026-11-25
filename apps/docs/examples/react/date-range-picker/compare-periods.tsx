import { useState } from 'react';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { addDays, daysBetween, plainDate, stepYear, type PickerPreset } from '@slotted/core/date';

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

export default function DateRangePickerComparePeriods() {
  const [period, setPeriod] = useState<DateRange | null>(SEPTEMBER);
  const [baseline, setBaseline] = useState<DateRange | null>(previousPeriod(SEPTEMBER));

  const shortcuts = [
    { label: 'Previous period', value: period === null ? null : previousPeriod(period) },
    { label: 'Same period last year', value: period === null ? null : lastYear(period) },
  ].filter((shortcut): shortcut is PickerPreset<DateRange> => shortcut.value !== null);

  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Period</FieldLabel>
        <DateRangePicker onValueChange={(value) => setPeriod(value)} value={period} />
      </Field>
      <Field>
        <FieldLabel>Compare to</FieldLabel>
        <DateRangePicker
          onValueChange={(value) => setBaseline(value)}
          presets={shortcuts}
          value={baseline}
        />
        <FieldDescription>Shortcuts follow the period above.</FieldDescription>
      </Field>
    </Stack>
  );
}
