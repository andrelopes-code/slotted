import { useState } from 'react';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { toISODateTime, wallClockIn, type PlainDateTime } from '@slotted/core/date';

/** The pickup as the server stores it: an instant, 7:00 PM UTC on September 30, 2026. */
const STORED = Date.UTC(2026, 8, 30, 19, 0);

export default function DateTimePickerTimeZones() {
  const [pickup, setPickup] = useState<PlainDateTime | null>(
    wallClockIn(STORED, 'America/Chicago'),
  );

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Pickup, Chicago terminal</FieldLabel>
        <DateTimePicker onValueChange={setPickup} timeZone="America/Chicago" value={pickup} />
        <FieldDescription>Today and Now follow the clock in Chicago.</FieldDescription>
      </Field>
      <Text size="sm" tone="muted">
        {pickup === null ? 'Value: null' : `Value: ${toISODateTime(pickup)}, with no offset`}
      </Text>
    </Stack>
  );
}
