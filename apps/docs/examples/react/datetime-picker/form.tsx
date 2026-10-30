import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import {
  compareDateTime,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const EARLIEST = plainDateTime(plainDate(2026, 10, 1), plainTime(8, 0));

export default function DateTimePickerForm() {
  const [pickup, setPickup] = useState<PlainDateTime | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const error =
    pickup !== null && compareDateTime(pickup, EARLIEST) < 0
      ? 'Choose October 1, 2026 at 8:00 AM or later.'
      : submitted && pickup === null
        ? 'Choose a pickup date and time.'
        : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const value = new FormData(event.currentTarget).get('pickupAt');
    const valid = pickup !== null && compareDateTime(pickup, EARLIEST) >= 0;
    setSaved(valid ? `Pickup booked for ${String(value)}.` : null);
  };

  const reset = () => {
    setPickup(null);
    setSubmitted(false);
    setSaved(null);
  };

  return (
    <form noValidate onReset={reset} onSubmit={submit}>
      <Stack gap={5}>
        <Field invalid={error === '' ? undefined : true} required>
          <FieldLabel>Pickup date and time</FieldLabel>
          <DateTimePicker
            min={EARLIEST}
            name="pickupAt"
            onValueChange={setPickup}
            referenceDateTime={EARLIEST}
            value={pickup}
          />
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline align="center" gap={3}>
          <Button type="submit">Book pickup</Button>
          <Button tone="secondary" type="reset" variant="outline">
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
