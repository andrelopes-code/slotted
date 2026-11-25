import { useState } from 'react';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  addDays,
  createDateTimeFormat,
  dayOfWeek,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const NOW = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));
const TOMORROW = plainDateTime(addDays(NOW.date, 1), plainTime(9, 0));
const NEXT_MONDAY = plainDateTime(
  addDays(NOW.date, (8 - dayOfWeek(NOW.date)) % 7 || 7),
  plainTime(9, 0),
);
const words = createDateTimeFormat({ locale: 'en-US' });

export default function DateTimePickerPublishAt() {
  const [publishAt, setPublishAt] = useState<PlainDateTime | null>(TOMORROW);

  return (
    <Field required>
      <FieldLabel>Publish the autumn price list at</FieldLabel>
      <DateTimePicker
        min={NOW}
        onValueChange={setPublishAt}
        presets={[
          { label: 'Tomorrow', value: TOMORROW },
          { label: 'Monday', value: NEXT_MONDAY },
        ]}
        referenceDateTime={NOW}
        timeZone="America/New_York"
        value={publishAt}
      />
      <FieldDescription>
        {publishAt === null
          ? 'Choose when the new prices go live, New York time.'
          : `Prices go live on ${words.describe(publishAt)}, New York time.`}
      </FieldDescription>
    </Field>
  );
}
