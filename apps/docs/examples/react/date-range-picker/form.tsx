import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { compareDate } from '@slotted/core/date';

const problem = (range: DateRange | null, submitted: boolean) => {
  if (range?.start && range.end && compareDate(range.end, range.start) < 0) {
    return 'The end date must be on or after the start date.';
  }
  if (submitted && (range?.start == null || range.end == null)) {
    return 'Enter a start and an end date.';
  }
  return '';
};

export default function DateRangePickerForm() {
  const [range, setRange] = useState<DateRange | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const error = problem(range, submitted);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const data = new FormData(event.currentTarget);
    setSaved(
      problem(range, true) === ''
        ? `Freeze saved from ${String(data.get('freezeStart'))} to ${String(data.get('freezeEnd'))}.`
        : null,
    );
  };

  const reset = () => {
    setRange(null);
    setSubmitted(false);
    setSaved(null);
  };

  return (
    <form noValidate onSubmit={submit} onReset={reset}>
      <Stack gap={5}>
        <Field required invalid={error === '' ? undefined : true}>
          <FieldLabel>Code freeze</FieldLabel>
          <DateRangePicker
            endName="freezeEnd"
            onValueChange={(value) => setRange(value)}
            startName="freezeStart"
            value={range}
          />
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Save freeze</Button>
          <Button type="reset" tone="secondary" variant="outline">
            Reset
          </Button>
          {saved && (
            <Text size="sm" tone="muted">
              {saved}
            </Text>
          )}
        </Inline>
      </Stack>
    </form>
  );
}
