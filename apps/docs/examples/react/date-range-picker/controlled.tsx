import { useState } from 'react';
import { Button } from '@slotted/react/button';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { endOfMonth, plainDate, startOfMonth, stepMonth, toISODate } from '@slotted/core/date';

const SEPTEMBER: DateRange = { start: plainDate(2026, 9, 1), end: plainDate(2026, 9, 30) };
const FALLBACK = plainDate(2026, 9, 1);

/** The calendar month before or after the one the range starts in. */
const shift = (range: DateRange | null, months: number): DateRange => {
  const first = startOfMonth(stepMonth(range?.start ?? FALLBACK, months).date);
  return { start: first, end: endOfMonth(first) };
};

export default function DateRangePickerControlled() {
  const [period, setPeriod] = useState<DateRange | null>(SEPTEMBER);

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Statement period</FieldLabel>
        <DateRangePicker onValueChange={(value) => setPeriod(value)} value={period} />
        <FieldDescription>
          {period?.start && period.end
            ? `Statement from ${toISODate(period.start)} to ${toISODate(period.end)}.`
            : 'Choose both dates to run the statement.'}
        </FieldDescription>
      </Field>
      <Inline gap={2}>
        <Button
          size="sm"
          tone="secondary"
          variant="outline"
          onClick={() => setPeriod(shift(period, -1))}
        >
          Previous month
        </Button>
        <Button
          size="sm"
          tone="secondary"
          variant="outline"
          onClick={() => setPeriod(shift(period, 1))}
        >
          Next month
        </Button>
        <Button size="sm" tone="secondary" variant="ghost" onClick={() => setPeriod(null)}>
          Clear
        </Button>
      </Inline>
    </Stack>
  );
}
