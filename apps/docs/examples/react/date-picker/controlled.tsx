import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import {
  addDays,
  createDateFormat,
  isPlainDate,
  plainDate,
  type PlainDate,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const words = createDateFormat({ locale: 'en-US' });

export default function DatePickerControlled() {
  const [followUp, setFollowUp] = useState<PlainDate | null>(addDays(TODAY, 7));

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Follow up with Harbor Freightways</FieldLabel>
        <DatePicker
          onValueChange={(value) => setFollowUp(isPlainDate(value) ? value : null)}
          value={followUp}
        />
        <FieldDescription>
          {followUp === null
            ? 'No follow-up scheduled.'
            : `Reminder on ${words.describe(followUp)}.`}
        </FieldDescription>
      </Field>
      <Inline gap={2}>
        <Button
          size="sm"
          tone="secondary"
          variant="outline"
          onClick={() => setFollowUp(addDays(TODAY, 7))}
        >
          In 1 week
        </Button>
        <Button
          size="sm"
          tone="secondary"
          variant="outline"
          onClick={() => setFollowUp(addDays(TODAY, 14))}
        >
          In 2 weeks
        </Button>
        <Button size="sm" tone="secondary" variant="ghost" onClick={() => setFollowUp(null)}>
          No follow-up
        </Button>
      </Inline>
    </Stack>
  );
}
