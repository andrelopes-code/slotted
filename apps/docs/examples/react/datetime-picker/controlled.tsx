import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import {
  addDays,
  createDateTimeFormat,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const words = createDateTimeFormat({ locale: 'en-US' });

export default function DateTimePickerControlled() {
  const [call, setCall] = useState<PlainDateTime | null>(
    plainDateTime(addDays(TODAY, 1), plainTime(9, 0)),
  );

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Call Harbor Freightways</FieldLabel>
        <DateTimePicker onValueChange={setCall} value={call} />
        <FieldDescription>
          {call === null ? 'No call scheduled.' : `Call on ${words.describe(call)}.`}
        </FieldDescription>
      </Field>
      <Inline gap={2}>
        <Button
          onClick={() => setCall(plainDateTime(addDays(TODAY, 1), plainTime(9, 0)))}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          Tomorrow, 9:00 AM
        </Button>
        <Button
          onClick={() => setCall(plainDateTime(addDays(TODAY, 2), plainTime(14, 0)))}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          Friday, 2:00 PM
        </Button>
        <Button onClick={() => setCall(null)} size="sm" tone="secondary" variant="ghost">
          No call
        </Button>
      </Inline>
    </Stack>
  );
}
