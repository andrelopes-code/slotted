import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerKeyboard() {
  const [last, setLast] = useState('Focus the field and press Alt+ArrowDown.');

  return (
    <Field>
      <FieldLabel>Dispatch date</FieldLabel>
      <DatePicker
        defaultValue={plainDate(2026, 9, 30)}
        messages={{ choose: 'Choose dispatch date', change: 'Change dispatch date, {date}' }}
        onOpenChange={(open, request) =>
          setLast(`${open ? 'Opened' : 'Closed'} by ${request.reason}.`)
        }
      />
      <FieldDescription>{last}</FieldDescription>
    </Field>
  );
}
