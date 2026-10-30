import { useState } from 'react';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerKeyboard() {
  const [last, setLast] = useState('Focus the field and press Alt+ArrowDown.');

  return (
    <Field>
      <FieldLabel>Dispatch</FieldLabel>
      <DateTimePicker
        defaultValue={plainDateTime(plainDate(2026, 9, 30), plainTime(16, 30))}
        messages={{ choose: 'Choose dispatch time', change: 'Change dispatch time, {date}' }}
        onOpenChange={(open, request) =>
          setLast(`${open ? 'Opened' : 'Closed'} by ${request.reason}.`)
        }
      />
      <FieldDescription>{last}</FieldDescription>
    </Field>
  );
}
