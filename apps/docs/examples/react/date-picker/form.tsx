import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { compareDate, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const EARLIEST = plainDate(2026, 10, 1);

export default function DatePickerForm() {
  const [date, setDate] = useState<PlainDate | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const error =
    date !== null && compareDate(date, EARLIEST) < 0
      ? 'Choose October 1, 2026 or later.'
      : submitted && date === null
        ? 'Choose a delivery date.'
        : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const value = new FormData(event.currentTarget).get('deliveryDate');
    const valid = date !== null && compareDate(date, EARLIEST) >= 0;
    setSaved(valid ? `Delivery booked for ${String(value)}.` : null);
  };

  const reset = () => {
    setDate(null);
    setSubmitted(false);
    setSaved(null);
  };

  return (
    <form noValidate onSubmit={submit} onReset={reset}>
      <Stack gap={5}>
        <Field required invalid={error === '' ? undefined : true}>
          <FieldLabel>Delivery date</FieldLabel>
          <DatePicker
            min={EARLIEST}
            name="deliveryDate"
            onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
            value={date}
          />
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Book delivery</Button>
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
