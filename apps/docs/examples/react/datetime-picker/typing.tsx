import { useState } from 'react';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime, toISODateTime } from '@slotted/core/date';

const RECEIVED = plainDateTime(plainDate(2026, 9, 30), plainTime(14, 30));

const REASONS: Record<string, string> = {
  keyboard: 'from the keyboard',
  select: 'chosen in the panel',
  clear: 'cleared',
  blur: 'completed when the field lost focus',
};

export default function DateTimePickerTyping() {
  const [change, setChange] = useState('No change yet.');

  return (
    <Field>
      <FieldLabel>Goods received at</FieldLabel>
      <DateTimePicker
        defaultValue={RECEIVED}
        onValueChange={(value, request) => {
          const text = value === null ? 'empty' : toISODateTime(value);
          setChange(`${text}, ${REASONS[request.reason] ?? request.reason}.`);
        }}
        referenceDateTime={RECEIVED}
      />
      <FieldDescription>{change}</FieldDescription>
    </Field>
  );
}
