import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { DateTimePicker, type DateTimePickerHandle } from '@slotted/react/datetime-picker';
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
  const picker = useRef<DateTimePickerHandle>(null);
  const [publishAt, setPublishAt] = useState<PlainDateTime | null>(TOMORROW);

  const choose = (next: PlainDateTime) => {
    setPublishAt(next);
    picker.current?.close();
  };

  return (
    <Field required>
      <FieldLabel>Publish the autumn price list at</FieldLabel>
      <DateTimePicker
        min={NOW}
        onValueChange={setPublishAt}
        presets={
          <>
            <Button onClick={() => choose(TOMORROW)} size="sm" variant="ghost">
              Tomorrow, 9:00 AM
            </Button>
            <Button onClick={() => choose(NEXT_MONDAY)} size="sm" variant="ghost">
              Monday, 9:00 AM
            </Button>
          </>
        }
        ref={picker}
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
