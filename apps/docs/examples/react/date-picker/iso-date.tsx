import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { isPlainDate, parseISODate, toISODate } from '@slotted/core/date';

export default function DatePickerIsoDate() {
  /* The API carries the date as text; the picker holds a PlainDate. */
  const [iso, setIso] = useState('2026-10-19');

  return (
    <Field>
      <FieldLabel>Statement date</FieldLabel>
      <DatePicker
        onValueChange={(value) => setIso(isPlainDate(value) ? toISODate(value) : '')}
        value={parseISODate(iso)}
      />
      <FieldDescription>
        {iso === '' ? 'No date sent.' : `The API receives ${iso}.`}
      </FieldDescription>
    </Field>
  );
}
