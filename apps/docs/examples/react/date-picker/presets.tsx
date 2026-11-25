import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

const PRESETS = [
  { label: 'End of the quarter', value: TODAY },
  { label: 'Next Monday', value: plainDate(2026, 10, 5) },
  { label: 'In two weeks', value: () => addDays(TODAY, 14) },
];

export default function DatePickerPresets() {
  const [date, setDate] = useState<PlainDate | null>(TODAY);

  return (
    <Field>
      <FieldLabel>Dispatch date</FieldLabel>
      <DatePicker
        onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
        presets={PRESETS}
        value={date}
      />
    </Field>
  );
}
