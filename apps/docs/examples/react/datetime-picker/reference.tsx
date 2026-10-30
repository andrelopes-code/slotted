import { useState } from 'react';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  createDateTimeFormat,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const END_OF_SHIFT = plainDateTime(plainDate(2026, 10, 1), plainTime(15, 0));
const words = createDateTimeFormat({ locale: 'en-US' });

export default function DateTimePickerReference() {
  const [collection, setCollection] = useState<PlainDateTime | null>(null);

  return (
    <Field>
      <FieldLabel>Courier collection</FieldLabel>
      <DateTimePicker
        onValueChange={setCollection}
        referenceDateTime={END_OF_SHIFT}
        value={collection}
      />
      <FieldDescription>
        {collection === null
          ? 'A day chosen in the calendar opens the time list on 3:00 PM.'
          : `Collection on ${words.describe(collection)}.`}
      </FieldDescription>
    </Field>
  );
}
