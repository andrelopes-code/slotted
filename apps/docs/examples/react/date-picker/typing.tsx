import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { isPlainDate, plainDate, toISODate } from '@slotted/core/date';

const REASONS: Record<string, string> = {
  keyboard: 'from the keyboard',
  pointer: 'pressed in the calendar',
  clear: 'cleared',
  blur: 'completed when the field lost focus',
};

export default function DatePickerTyping() {
  const [change, setChange] = useState('No change yet.');

  return (
    <Field>
      <FieldLabel>Goods received on</FieldLabel>
      <DatePicker
        defaultValue={plainDate(2026, 9, 30)}
        onValueChange={(value, request) => {
          const date = isPlainDate(value) ? toISODate(value) : 'empty';
          setChange(`${date}, ${REASONS[request.reason] ?? request.reason}.`);
        }}
      />
      <FieldDescription>{change}</FieldDescription>
    </Field>
  );
}
